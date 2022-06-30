"""
Test the reporting on entities features.
"""

import os

from coverage import CoverageStatus, Entities, make_dhtml_report
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:
    make_dhtml_report(
        "multiple_projects", "p.gpr", os.path.join(os.getcwd(), "dhtml")
    )

    driver.get("file://" + os.getcwd() + "/dhtml/index.html")

    driver.check_file_stat("Prj2", "pk2.adb", CoverageStatus.COVERED, 1)
    driver.check_file_stat("Prj1", "pk1.adb", CoverageStatus.COVERED, 1)
    driver.check_file_stat("P", "t1.adb", CoverageStatus.COVERED, 2)
    driver.check_file_stat("P", "t2.adb", CoverageStatus.COVERED, 2)

    driver.report_on_entities([Entities.Stmt])
    driver.check_project_stat("P", CoverageStatus.COVERED, 8)
    driver.check_total_stat(CoverageStatus.NOT_COVERED, 5)

    driver.report_on_entities([Entities.Stmt, Entities.Decision])
    driver.check_project_stat("Prj2", CoverageStatus.PARTIALLY_COVERED, 1)

    driver.report_on_entities([Entities.Stmt, Entities.Decision, Entities.MCDC])
    driver.check_total_stat(CoverageStatus.COVERED, 17)

    driver.report_on_lines()
    driver.check_total_stat(CoverageStatus.COVERED, 6)

    make_dhtml_report("exemptions", "p.gpr", os.path.join(os.getcwd(), "dhtml"))

    driver.get("file://" + os.getcwd() + "/dhtml/index.html")

    driver.report_on_entities([Entities.Stmt])
    driver.check_total_stat(CoverageStatus.COVERED, 1)
    driver.check_total_stat(CoverageStatus.EXEMPTED_WITH_VIOLATION, 1)
    driver.check_total_stat(CoverageStatus.EXEMPTED_NO_VIOLATION, 1)
