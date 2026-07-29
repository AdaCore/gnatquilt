"""
Verify that when a file has no SCO, it is written as 100% in the "covered"
column in the file enumeration table.
"""

import os

from coverage import build_run_and_coverage
from selenium.webdriver.common.by import By
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
    line = driver.find_element(By.LINK_TEXT, "foo.ads").find_element(By.XPATH, "../..")

    assert line.tag_name == "tr", f"{line.tag_name} is not tr"

    # Look at the 3 "td"s after the name

    [total, covered, not_covered] = line.find_elements(By.XPATH, "./td")[1:4]

    # There should not be any SCO for foo.ads
    assert total.text == "0"

    # Check 2 spans in "not_covered"
    [literal, percentage] = not_covered.find_elements(By.XPATH, "./div/span")
    assert literal.text == "0"
    assert percentage.text == "0%"

    # Check 2 spans in "covered"
    [literal, percentage] = covered.find_elements(By.XPATH, "./div/span")
    assert literal.text == "0"
    assert percentage.text == "100%", f"{percentage.text} should be 100%"
