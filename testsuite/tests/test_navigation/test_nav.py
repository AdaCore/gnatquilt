"""
This tests basic navigation features in the DHTML report produced by gnatcov.
It simply navigates from the menu to a file, then back to the menu, using the
selenium webdriver.
"""

from distutils.spawn import find_executable
import os

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.firefox.options import Options


class Test:

    def setup_method(self, method):
        firefox_options = Options()
        firefox_options.add_argument("--headless")
        binary = FirefoxBinary(find_executable('firefox'))
        self.driver = webdriver.Firefox(firefox_binary=binary,
                                        options=firefox_options)

    def teardown_method(self, method):
        self.driver.quit()

    def test(self):
        self.driver.get("file://" + os.getcwd() + "/dhtml/index.html")

        # Navigate to a source file
        self.driver.find_element(By.LINK_TEXT, "pk1.adb").click()

        # Click on an expandable message
        self.driver.find_element(By.CSS_SELECTOR, ".mat-icon").click()

        # Come back to the menu
        self.driver.find_element(By.LINK_TEXT, "⇪ Back to sources list").click()

        # Navigate to another source file
        self.driver.find_element(By.LINK_TEXT, "t2.adb").click()
        self.driver.find_element(By.LINK_TEXT, "⇪ Back to sources list").click()
        self.driver.close()
