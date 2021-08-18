import os

from coverage import make_dhtml_report
from webdriver import FirefoxDriver

from selenium.webdriver.common.by import By

with FirefoxDriver() as driver:
    make_dhtml_report(
        "multiple_projects", "p.gpr", os.path.join(os.getcwd(), "dhtml")
    )

    driver.get("file://" + os.getcwd() + "/dhtml/index.html")

    # Navigate to a source file
    driver.find_element(By.LINK_TEXT, "pk1.adb").click()

    # Click on an expandable message
    driver.find_element(By.CSS_SELECTOR, ".mat-icon").click()

    # Come back to the menu
    driver.find_element(By.LINK_TEXT, "⇪ Back to sources list").click()

    # Navigate to another source file
    driver.find_element(By.LINK_TEXT, "t2.adb").click()
    driver.find_element(By.LINK_TEXT, "⇪ Back to sources list").click()
