"""
Test the reporting on the subprogram metrics.
"""

import os

from selenium.webdriver.common.by import By

from coverage import build_run_and_coverage, CoverageStatus, Entities
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:
    build_run_and_coverage("src-traces", "p.gpr", "stmt+mcdc", ["obj/main"])

    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "main.adb").click()

    # Check that undetermined coverage is reported
    driver.check_subp_stat("Id", CoverageStatus.UNDETERMINED_COVERAGE, 1)

    # Check that exempted undetermined coverage is reported
    driver.check_subp_stat(
        "Id_Exempted", CoverageStatus.EXEMPTED_UNDETERMINED_COVERAGE, 1
    )

    # Check subprogram metrics values

    driver.check_subp_stat("Alias_Gt", CoverageStatus.NOT_COVERED, 1)
    driver.check_subp_stat("Within", CoverageStatus.PARTIALLY_COVERED, 1)

    driver.report_on_entities([Entities.Stmt])
    driver.check_subp_stat("Within", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("Alias_Gt", CoverageStatus.NOT_COVERED, 1)

    driver.report_on_entities([Entities.Stmt])
    driver.check_subp_stat("Id_Int", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("Id_Int_Renamed", CoverageStatus.COVERED, 1)

    # Check that navigation links work (navigate to a subprogram correctly
    # scrolls down to it).
    subp_clicked = "Not_Within"
    driver.navigate_to_subp(subp_clicked)
    found = False
    for source_line_td in driver.find_elements(
        By.CLASS_NAME, "xcov-source-row-text"
    ):
        if source_line_td.find_elements(
            By.XPATH, f".//span[contains(., '{subp_clicked}')]"
        ):
            found = True
            break

    assert found
