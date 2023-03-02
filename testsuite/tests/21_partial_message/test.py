"""
Regression testcase: for line with multiple statement SCOs, the decision
violations messages were incomplete, and missed the SCO indication.
"""

import os

from selenium.webdriver.common.by import By

from coverage import build_run_and_coverage
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:
    build_run_and_coverage(
        "src-traces",
        "p.gpr",
        "stmt+mcdc",
        ["obj/main"],
    )

    # Check the content of the message:

    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "main.c").click()

    # Click on an expandable message
    driver.find_element(
        By.XPATH,
        ".//td[contains(@class,'xcov-source-row-line-no')]/div/mat-icon",
    ).click()

    # Check that the SCO indication on the decision violation is not missing
    # from the report.
    driver.find_element(
        By.XPATH,
        """.//span[contains(string(),'decision "i < 0;" at 2:19')]""",
    )
