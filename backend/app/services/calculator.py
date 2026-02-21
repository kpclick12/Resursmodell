from app.models import (
    SchoolInput,
    CalculationParameters,
    SchoolResult,
    SummaryResult,
    CalculateResponse,
)


def calculate_allocation(
    schools: list[SchoolInput], params: CalculationParameters
) -> CalculateResponse:
    results: list[SchoolResult] = []

    for school in schools:
        socio_add = min(
            (school.socioeconomic_index / params.index_scale)
            * params.socioeconomic_weight
            * params.base_amount_per_pupil,
            params.max_socioeconomic_supplement,
        )
        per_pupil = params.base_amount_per_pupil + socio_add
        if school.school_type == "kommunal":
            per_pupil += params.municipal_supplement

        total = per_pupil * school.num_students

        results.append(
            SchoolResult(
                school_name=school.school_name,
                school_type=school.school_type,
                num_students=school.num_students,
                socioeconomic_index=school.socioeconomic_index,
                district=school.district,
                socioeconomic_addition_per_pupil=round(socio_add, 2),
                total_per_pupil=round(per_pupil, 2),
                total_allocation=round(total, 2),
            )
        )

    summary = _build_summary(results)
    return CalculateResponse(summary=summary, schools=results)


def _build_summary(results: list[SchoolResult]) -> SummaryResult:
    kommunal = [r for r in results if r.school_type == "kommunal"]
    fristaende = [r for r in results if r.school_type == "fristående"]

    total_budget = sum(r.total_allocation for r in results)
    total_pupils = sum(r.num_students for r in results)
    kommunal_pupils = sum(r.num_students for r in kommunal)
    fristaende_pupils = sum(r.num_students for r in fristaende)

    fristaende_budget = sum(r.total_allocation for r in fristaende)
    socio_total = sum(r.socioeconomic_addition_per_pupil * r.num_students for r in results)

    def avg_per_pupil(school_list: list[SchoolResult]) -> float:
        pupils = sum(r.num_students for r in school_list)
        if pupils == 0:
            return 0
        return round(sum(r.total_allocation for r in school_list) / pupils, 2)

    allocations = [r.total_allocation for r in results]

    return SummaryResult(
        total_budget=round(total_budget, 2),
        total_schools=len(results),
        kommunal_schools=len(kommunal),
        fristaende_schools=len(fristaende),
        total_pupils=total_pupils,
        kommunal_pupils=kommunal_pupils,
        fristaende_pupils=fristaende_pupils,
        avg_per_pupil_overall=avg_per_pupil(results),
        avg_per_pupil_kommunal=avg_per_pupil(kommunal),
        avg_per_pupil_fristaende=avg_per_pupil(fristaende),
        min_allocation=min(allocations) if allocations else 0,
        max_allocation=max(allocations) if allocations else 0,
        fristaende_budget_share=round(fristaende_budget / total_budget * 100, 2) if total_budget else 0,
        socioeconomic_total=round(socio_total, 2),
        socioeconomic_share=round(socio_total / total_budget * 100, 2) if total_budget else 0,
    )
