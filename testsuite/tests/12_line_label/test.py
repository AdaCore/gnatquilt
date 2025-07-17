"""
Verify that the correct character is displayed at the start of the line
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

    # Go to the main.adb report

    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "main.adb").click()

    # Coverage symbols expected for each of the lines
    expected_cov = [
        ".",
        ".",
        "+",
        "+",
        "+",
        ".",
        ".",
        "!",
        "-",
        "*",
        "*",
        "*",
        ".",
        "#",
        "#",
        "#",
        ".",
        ".",
    ]

    actual_cov = [
        elem.text
        for elem in driver.find_elements(
            By.XPATH,
            "//td[contains(@class, 'xcov-source-row-cov-symbol')]"
            "//div[contains(@class, 'xcov-source-line-cov')]",
        )
    ]

    for line in range(len(expected_cov)):
        assert actual_cov[line] == expected_cov[line], (
            f"Wrong coverage symbol for line {line + 1}, "
            f"expected {expected_cov[line]} but got {actual_cov[line]}"
        )
