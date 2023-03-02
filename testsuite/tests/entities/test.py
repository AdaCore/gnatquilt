"""
Test the reporting on entities features.
"""

import os

from coverage import build_run_and_coverage, CoverageStatus, Entities
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:
    build_run_and_coverage(
        "src-traces",
        "p.gpr",
        "stmt+mcdc",
        ["obj/t1", "obj/t2", "obj/t_exemption"],
    )

    driver.get("file://" + os.getcwd() + "/obj/index.html")

    driver.check_file_stat("Prj2", "pk2.adb", CoverageStatus.COVERED, 1)
    driver.check_file_stat("Prj1", "pk1.adb", CoverageStatus.COVERED, 1)
    driver.check_file_stat("P", "t1.adb", CoverageStatus.COVERED, 2)
    driver.check_file_stat("P", "t2.adb", CoverageStatus.COVERED, 2)

    driver.report_on_entities([Entities.Stmt])
    driver.check_project_stat("P", CoverageStatus.COVERED, 9)
    driver.check_total_stat(CoverageStatus.NOT_COVERED, 5)

    driver.check_file_stat("P", "t_exemption.adb", CoverageStatus.COVERED, 1)
    driver.check_file_stat(
        "P", "t_exemption.adb", CoverageStatus.EXEMPTED_WITH_VIOLATION, 1
    )
    driver.check_file_stat(
        "P", "t_exemption.adb", CoverageStatus.EXEMPTED_NO_VIOLATION, 1
    )

    driver.report_on_entities([Entities.Stmt, Entities.Decision])
    driver.check_project_stat("Prj2", CoverageStatus.PARTIALLY_COVERED, 1)

    driver.report_on_entities([Entities.Stmt, Entities.Decision, Entities.MCDC])
    driver.check_total_stat(CoverageStatus.COVERED, 18)

    driver.report_on_lines()
    driver.check_total_stat(CoverageStatus.COVERED, 7)
