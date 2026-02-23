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
    p = params

    # --- Step 1: Split total budget ---
    budget_gs = p.total_budget * p.budget_grundskola
    budget_ft = p.total_budget * p.budget_fritidshem

    # --- Step 2: Split into grundersättning + strukturersättning pools ---
    pool_grund_gs  = budget_gs * (1 - p.andel_struktur_grundskola)
    pool_struk_gs  = budget_gs * p.andel_struktur_grundskola
    pool_grund_ft  = budget_ft * (1 - p.andel_struktur_fritidshem)
    pool_struk_ft  = budget_ft * p.andel_struktur_fritidshem

    # --- Step 3: Compute weighted pupils per school (grundskola) ---
    def viktade_gs(s: SchoolInput) -> float:
        return (
            s.elever_f   * p.vikt_f
            + s.elever_ak1 * p.vikt_ak1
            + s.elever_ak2 * p.vikt_ak2
            + s.elever_ak3 * p.vikt_ak3
            + s.elever_ak4 * p.vikt_ak4
            + s.elever_ak5 * p.vikt_ak5
            + s.elever_ak6 * p.vikt_ak6
            + s.elever_ak7 * p.vikt_ak7
            + s.elever_ak8 * p.vikt_ak8
            + s.elever_ak9 * p.vikt_ak9
        )

    def viktade_ft(s: SchoolInput) -> float:
        return (
            s.elever_fritids_6_9   * p.vikt_fritids_6_9
            + s.elever_fritids_10_12 * p.vikt_fritids_10_12
        )

    vikt_gs_list = [viktade_gs(s) for s in schools]
    vikt_ft_list = [viktade_ft(s) for s in schools]

    total_vikt_gs = sum(vikt_gs_list)
    total_vikt_ft = sum(vikt_ft_list)

    # --- Step 4: Compute strukturtal per school ---
    def struk_gs(s: SchoolInput) -> float:
        return s.total_school_students * s.socioeconomic_index

    def struk_ft(s: SchoolInput) -> float:
        return s.total_fritids_students * s.socioeconomic_index

    struk_gs_list = [struk_gs(s) for s in schools]
    struk_ft_list = [struk_ft(s) for s in schools]

    total_struk_gs = sum(struk_gs_list)
    total_struk_ft = sum(struk_ft_list)

    results: list[SchoolResult] = []

    for i, school in enumerate(schools):
        # Grundersättning (proportional by weighted pupils)
        ge_gs = (vikt_gs_list[i] / total_vikt_gs * pool_grund_gs) if total_vikt_gs > 0 else 0.0
        ge_ft = (vikt_ft_list[i] / total_vikt_ft * pool_grund_ft) if total_vikt_ft > 0 else 0.0

        # Strukturersättning (proportional by pupils × index)
        se_gs = (struk_gs_list[i] / total_struk_gs * pool_struk_gs) if total_struk_gs > 0 else 0.0
        se_ft = (struk_ft_list[i] / total_struk_ft * pool_struk_ft) if total_struk_ft > 0 else 0.0

        # Step 5: grundbelopp_brutto
        brutto = ge_gs + se_gs + ge_ft + se_ft

        # Steps 6–8: adjustments
        lokalt_avdrag = 0.0
        moms_tillagg = 0.0
        admin_tillagg = 0.0
        tillagg_totalt = 0.0
        nettokvot: float | None = None

        if school.school_type == "kommunal":
            # Step 7: local deduction
            lokalt_avdrag = brutto * p.avdrag_kommunal_procent
            # Step 8: tillägg
            total_elever = school.total_school_students
            total_fritids = school.total_fritids_students
            tillagg_totalt = (
                p.tillagg_skoladmin_per_elev * total_elever
                + p.tillagg_likvärdig_grund_per_elev * total_elever
                + p.tillagg_likvärdig_struktur_per_elev * total_elever
                + p.tillagg_fritidsavgift_per_fritidsbarn * total_fritids
            )
            netto = brutto - lokalt_avdrag + tillagg_totalt
            nettokvot = (netto / brutto) if brutto > 0 else None
        else:
            # Step 6: fristående adjustments
            moms_tillagg  = brutto * p.moms_kompensation
            admin_tillagg = brutto * p.admin_kompensation_fri
            netto = brutto + moms_tillagg + admin_tillagg

        results.append(
            SchoolResult(
                school_name=school.school_name,
                school_type=school.school_type,
                elever_f=school.elever_f,
                elever_ak1=school.elever_ak1,
                elever_ak2=school.elever_ak2,
                elever_ak3=school.elever_ak3,
                elever_ak4=school.elever_ak4,
                elever_ak5=school.elever_ak5,
                elever_ak6=school.elever_ak6,
                elever_ak7=school.elever_ak7,
                elever_ak8=school.elever_ak8,
                elever_ak9=school.elever_ak9,
                elever_fritids_6_9=school.elever_fritids_6_9,
                elever_fritids_10_12=school.elever_fritids_10_12,
                total_school_students=school.total_school_students,
                total_fritids_students=school.total_fritids_students,
                socioeconomic_index=school.socioeconomic_index,
                district=school.district,
                grundersättning=round(ge_gs, 4),
                strukturersättning=round(se_gs, 4),
                grundersättning_fritids=round(ge_ft, 4),
                strukturersättning_fritids=round(se_ft, 4),
                grundbelopp_brutto=round(brutto, 4),
                lokalt_avdrag=round(lokalt_avdrag, 4),
                moms_tillagg=round(moms_tillagg, 4),
                admin_tillagg=round(admin_tillagg, 4),
                tillagg_totalt=round(tillagg_totalt, 4),
                netto=round(netto, 4),
                nettokvot=round(nettokvot, 6) if nettokvot is not None else None,
            )
        )

    summary = _build_summary(results, params)
    return CalculateResponse(summary=summary, schools=results)


def _build_summary(
    results: list[SchoolResult],
    params: CalculationParameters | None = None,
) -> SummaryResult:
    kommunal   = [r for r in results if r.school_type == "kommunal"]
    fristaende = [r for r in results if r.school_type == "fristående"]

    total_budget_val = params.total_budget if params else round(sum(r.netto for r in results), 4)

    total_pupils       = sum(r.total_school_students for r in results)
    kommunal_pupils    = sum(r.total_school_students for r in kommunal)
    fristaende_pupils  = sum(r.total_school_students for r in fristaende)

    fristaende_netto = sum(r.netto for r in fristaende)
    total_netto      = sum(r.netto for r in results)

    def avg_netto_per_pupil(school_list: list[SchoolResult]) -> float:
        pupils = sum(r.total_school_students for r in school_list)
        if pupils == 0:
            return 0.0
        netto = sum(r.netto for r in school_list)
        return round(netto / pupils, 4)

    nettos = [r.netto for r in results]

    # Structural total = sum of strukturersättning (GS + Fritids)
    struk_total = sum(r.strukturersättning + r.strukturersättning_fritids for r in results)

    return SummaryResult(
        total_budget=total_budget_val,
        total_schools=len(results),
        kommunal_schools=len(kommunal),
        fristaende_schools=len(fristaende),
        total_pupils=total_pupils,
        kommunal_pupils=kommunal_pupils,
        fristaende_pupils=fristaende_pupils,
        avg_netto_per_pupil_overall=avg_netto_per_pupil(results),
        avg_netto_per_pupil_kommunal=avg_netto_per_pupil(kommunal),
        avg_netto_per_pupil_fristaende=avg_netto_per_pupil(fristaende),
        min_allocation=min(nettos) if nettos else 0,
        max_allocation=max(nettos) if nettos else 0,
        fristaende_budget_share=round(fristaende_netto / total_netto * 100, 2) if total_netto else 0,
        strukturersattning_total=round(struk_total, 4),
        strukturersattning_share=round(struk_total / total_budget_val * 100, 2) if total_budget_val else 0,
        model_version="v2",
    )
