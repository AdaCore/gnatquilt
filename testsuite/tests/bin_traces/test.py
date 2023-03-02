"""
Regression testcase: binary traces were broken with the addition of scoped
metrics support. Add a basic test case simply checking that we get a coverage
report for the main file.
"""

import os

from coverage import build_run_and_coverage
from webdriver import FirefoxDriver

from selenium.webdriver.common.by import By

with FirefoxDriver() as driver:

    build_run_and_coverage("bin-traces", "p.gpr", "stmt+mcdc", ["obj/main"])

    driver.get("file://" + os.getcwd() + "/obj/index.html")

    # Navigate to a source file
    driver.find_element(By.LINK_TEXT, "main.adb").click()

    # Click on an expandable message
    driver.find_element(By.CSS_SELECTOR, ".mat-icon").click()

    # Come back to the menu
    driver.find_element(By.LINK_TEXT, "⇪ Back to sources list").click()
