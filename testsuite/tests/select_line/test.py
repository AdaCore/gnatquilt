"""
Test the line selection feature.
"""

import os

from selenium.webdriver.common.by import By

from coverage import build_run_and_coverage
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:

    def check_line_selection(expected_text):
        driver.implicitly_wait(1)
        selected_line = driver.find_element(
            By.XPATH,
            "//tr[contains(@class, 'selected')]"
            "//td[contains(@class, 'xcov-source-row-text')]",
        )
        # We cannot surround the whole assert expression with parenthesis,
        # as it will otherwise turn the assertion expression into a tuple
        # that would always be True.
        assert (
            selected_line.text == expected_text
        ), f"Expected {expected_text!r} but got {selected_line.text!r}"

    build_run_and_coverage(
        "src-traces",
        "test.gpr",
        "stmt",
        ["obj/main"],
    )

    # Check that when passing a URL with a line it is selected and in the
    # viewport (i.e. the visible part of the screen).

    driver.get(
        "file://"
        + os.getcwd()
        + "/obj/index.html#./sources/Test/main.cpp.hunk.js?line=132"
    )
    check_line_selection("int main()")

    # Then, select a line by clicking on it and check that the URL changes and
    # that the line is selected.
    line_elem = driver.find_element(
        By.XPATH,
        "//tr[contains(@class, 'xcov-source-line') and"
        " contains(., 134)]//td[contains(@class, 'xcov-source-row-text')]",
    ).click()

    assert "line=134" in driver.current_url, "Selected line not in URL"
    check_line_selection("  return 0;")
