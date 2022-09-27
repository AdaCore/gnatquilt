"""
Regression testcase: check that gnatcov produces a valid dhtml report when the
user project is relocated but --source-rebase / --source-search are not passed.
The DHTML JS code used to crash when trying to navigate to a source file.

Note that in that case, the user should pass the `--source-rebase` option to
gnatcov coverage, nevertheless we should still be able to produce a valid
report.
"""

import os

from e3.os.process import Run

from selenium.webdriver.common.by import By

from webdriver import FirefoxDriver

with FirefoxDriver() as driver:
    Run(["make"])

    driver.get("file://" + os.getcwd() + "/dhtml/index.html")

    # Only check if we can navigate in a source file
    driver.find_element(By.LINK_TEXT, "main.adb").click()
    driver.find_element(By.LINK_TEXT, "⇪ Back to sources list").click()
