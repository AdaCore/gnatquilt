"""
Test the message selection feature.
"""

import os

from selenium.webdriver.common.by import By

from coverage import build_run_and_coverage
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:

    def check_message_selection(expected_text):
        driver.implicitly_wait(1)
        sco_text = driver.find_element(
            By.XPATH,
            "//tr[contains(@class, 'selected')]"
            "//span[contains(@class, 'xcov-source-line-attached-sco')]",
        )
        assert (
            sco_text.text == expected_text
        ), f"Expected {expected_text!r} but got {sco_text.text!r}"

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
        + "/obj/index.html#./sources/Test/main.cpp.hunk.js?line=135&message=0"
    )
    check_message_selection('statement "int a = 0..." at 135:5')

    # Then, select a line by clicking on it and check that the URL changes and
    # that the line was expanded and the message selected.
    line_elem = driver.find_elements(
        By.XPATH,
        "//td[contains(@class, 'xcov-source-line-attached-message-label')]",
    )[1].click()

    assert "message=1" in driver.current_url, "Selected message not in URL"
    check_message_selection('statement "int b = 0..." at 135:16')
