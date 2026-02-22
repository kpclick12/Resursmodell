from app.models import (
    SchoolInput,
    CalculationParameters,
    SchoolResult,
    SummaryResult,
    CalculateResponse,
)


def _calc_year_group(
    num: int,
    grundbelopp: float,
    index: float,
    structural_share: float,
    index_scale: float,
) -> tuple[float, float]:
    """Return (per_pupil, total_allocation) for one year group."""
    per_pupil = grundbelopp * ((1 - structural_share) + structural_share * index / index_scale)
    return round(per_pupil, 2), round(per_pupil * num, 2)


def calculate_allocation(
    schools: list[SchoolInput], params: CalculationParameters
) -> CalculateResponse:
    results: list[SchoolResult] = []

    for school in schools:
        idx = school.socioeconomic_index
        s = params.structural_share
        sc = params.index_scale

        pp_fsk,  alloc_fsk  = _calc_year_group(school.num_fsk,          params.g_fsk,       idx, s, sc)
        pp_ak13, alloc_ak13 = _calc_year_group(school.num_ak1_3,        params.g_ak13,      idx, s, sc)
        pp_ak46, alloc_ak46 = _calc_year_group(school.num_ak4_6,        params.g_ak46,      idx, s, sc)
        pp_ak79, alloc_ak79 = _calc_year_group(school.num_ak7_9,        params.g_ak79,      idx, s, sc)
        pp_f69,  alloc_f69  = _calc_year_group(school.num_fritids_6_9,  params.g_fritids_69,  idx, s, sc)
        pp_f12,  alloc_f12  = _calc_year_group(school.num_fritids_10_12, params.g_fritids_1012, idx, s, sc)

        school_alloc = round(alloc_fsk + alloc_ak13 + alloc_ak46 + alloc_ak79, 2)
        fritids_alloc = round(alloc_f69 + alloc_f12, 2)
        total_alloc = round(school_alloc + fritids_alloc, 2)

        results.append(
            SchoolResult(
                school_name=school.school_name,
                school_type=school.school_type,
                num_fsk=school.num_fsk,
                num_ak1_3=school.num_ak1_3,
                num_ak4_6=school.num_ak4_6,
                num_ak7_9=school.num_ak7_9,
                num_fritids_6_9=school.num_fritids_6_9,
                num_fritids_10_12=school.num_fritids_10_12,
                total_school_students=school.total_school_students,
                total_fritids_students=school.total_fritids_students,
                socioeconomic_index=idx,
                district=school.district,
                per_pupil_fsk=pp_fsk,
                per_pupil_ak1_3=pp_ak13,
                per_pupil_ak4_6=pp_ak46,
                per_pupil_ak7_9=pp_ak79,
                per_pupil_fritids_6_9=pp_f69,
                per_pupil_fritids_10_12=pp_f12,
                total_school_allocation=school_alloc,
                total_fritids_allocation=fritids_alloc,
                total_allocation=total_alloc,
            )
        )

    summary = _build_summary(results, params)
    return CalculateResponse(summary=summary, schools=results)


def _build_summary(
    results: list[SchoolResult],
    params: CalculationParameters | None = None,
) -> SummaryResult:
    kommunal = [r for r in results if r.school_type == "kommunal"]
    fristaende = [r for r in results if r.school_type == "fristående"]

    total_budget = round(sum(r.total_allocation for r in results), 2)
    total_pupils = sum(r.total_school_students for r in results)
    kommunal_pupils = sum(r.total_school_students for r in kommunal)
    fristaende_pupils = sum(r.total_school_students for r in fristaende)

    fristaende_budget = sum(r.total_allocation for r in fristaende)

    def avg_school_per_pupil(school_list: list[SchoolResult]) -> float:
        pupils = sum(r.total_school_students for r in school_list)
        if pupils == 0:
            return 0.0
        alloc = sum(r.total_school_allocation for r in school_list)
        return round(alloc / pupils, 2)

    allocations = [r.total_allocation for r in results]

    # Structural (index-driven) portion of the budget.
    # For each school: structural = sum_y(num_y * g_y * structural_share * idx/scale)
    # = structural_share * idx/scale * sum_y(num_y * g_y)
    # sum_y(num_y * g_y) can be back-computed from total_allocation:
    #   total_alloc = sum_y(num_y*g_y) * ((1-s) + s*idx/scale)
    # So sum_y(num_y*g_y) = total_alloc / ((1-s) + s*idx/scale)
    if params is not None:
        s = params.structural_share
        sc = params.index_scale
        socio_total = 0.0
        for r in results:
            denom = (1 - s) + s * r.socioeconomic_index / sc
            if denom > 0:
                weighted_g = r.total_allocation / denom
                socio_total += s * r.socioeconomic_index / sc * weighted_g
        socio_total = round(socio_total, 2)
    else:
        # Fallback for legacy plans loaded without params
        socio_total = 0.0

    return SummaryResult(
        total_budget=total_budget,
        total_schools=len(results),
        kommunal_schools=len(kommunal),
        fristaende_schools=len(fristaende),
        total_pupils=total_pupils,
        kommunal_pupils=kommunal_pupils,
        fristaende_pupils=fristaende_pupils,
        avg_per_pupil_overall=avg_school_per_pupil(results),
        avg_per_pupil_kommunal=avg_school_per_pupil(kommunal),
        avg_per_pupil_fristaende=avg_school_per_pupil(fristaende),
        min_allocation=min(allocations) if allocations else 0,
        max_allocation=max(allocations) if allocations else 0,
        fristaende_budget_share=round(fristaende_budget / total_budget * 100, 2) if total_budget else 0,
        socioeconomic_total=socio_total,
        socioeconomic_share=round(socio_total / total_budget * 100, 2) if total_budget else 0,
    )
