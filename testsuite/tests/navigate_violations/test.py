"""
Test navigation between violations when using the n/p keyboard shortcuts.
"""

import os

from selenium.webdriver.common.by import By

from coverage import build_run_and_coverage
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:

    def check_line_selection(expected_text):
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
        "p.gpr",
        "stmt",
        ["obj/main"],
    )

    # Navigate to the main source file
    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "main.adb").click()
    # Set a timeout as the navigation may take a bit of time
    driver.implicitly_wait(1)

    # Check that pressing the n (next) shortcut without having selected a line
    # before goes to the first violation.
    driver.find_element(By.XPATH, "//body").send_keys("n")
    check_line_selection("         return L > R;")
    driver.find_element(By.XPATH, "//body").send_keys("n")
    check_line_selection("   function Id (A : T) return T is (A);")

    # Then test the p (previous) shortcut
    driver.find_element(By.XPATH, "//body").send_keys("p")
    check_line_selection("         return L > R;")
