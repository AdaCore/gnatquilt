"""
Test SCO selection
"""

import os

from selenium.webdriver.common.by import By

from coverage import build_run_and_coverage
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:
    build_run_and_coverage(
        "src-traces",
        "test.gpr",
        "stmt+mcdc",
        ["obj/main"],
    )

    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "pkg.adb").click()
    driver.check_sco_selection(16, 0, ["Arbitrarily_Long_Variable_1"])

    driver.check_sco_selection(
        24,
        0,
        [
            "Arbitrarily_Long_Variable_1",
            "          and then Arbitrarily_Long_Variable_2",
        ],
    )
    driver.check_sco_selection(32, 0, ['Put_Line ("Hello world");'])
