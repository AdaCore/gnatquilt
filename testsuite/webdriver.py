from distutils.spawn import find_executable

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.firefox.options import Options


class FirefoxDriver(webdriver.Firefox):
    def __init__(self):
        firefox_options = Options()
        firefox_options.add_argument("--headless")

        # As in production mode, firefox is not located at the standard
        # system location, we have to provide the full path to it.
        binary = FirefoxBinary(find_executable("firefox"))
        super().__init__(firefox_binary=binary, options=firefox_options)

    def __exit__(self, type, value, traceback):
        self.close()
        self.quit()

    def find_element_safe(self, by, value):
        try:
            return self.find_element(by, value)
        except NoSuchElementException:
            return None

    def __column_number_for_status(self, status):
        status_index = 0
        columns = self.find_elements(
            By.XPATH, "//td[contains(.,'Total')]/ancestor::table//th"
        )
        for column in columns:
            if column.text == status:
                break
            status_index += 1
        return status_index

    def report_on_lines(self):
        """
        Activate reporting on lines
        """

        self.find_element(By.XPATH, "//button[contains(.,'Lines')]").click()

    def report_on_entities(self, entities):
        """
        Activate reporting on entities for the given level.

        :param Entities entities: entities for which we want coverage stats
        """

        # We will start from a clean state, by reporting on lines
        self.report_on_lines()

        for entity in entities:
            self.find_element(
                By.XPATH, f"//button[contains(.,'{entity}')]"
            ).click()

    def check_file_stat(self, project, filename, status, statistic):
        """
        Check that reported coverage results are as expected. Note that all the
        string parameters are case sensitive, and should be as rendered in the
        browser.

        :param str project: name of the project in which the file is.
        :param str filename: name of the file for which we want to check
            expectations.
        :param CoverageStatus status: status for which we want to check
            expectations.
        :param int statistic: expected statistic given the 3 previous
            parameters.
        """

        # First, we identify the column in which the statistic of interest
        # should be, according to status value
        status_index = self.__column_number_for_status(str(status))

        project_section = self.find_element(
            By.XPATH, f"//h2[text()=' ❯ {project} ']/parent::div"
        )
        file_stats = project_section.find_elements(
            By.XPATH, f"//td[contains(.,'{filename}')]/parent::tr//td"
        )

        # A table cell contains both the stat number and a stat percent. Split
        # the text to get the stat number.
        assert int(file_stats[status_index].text.split()[0]) == statistic

    def check_project_stat(self, project, status, statistic):
        """
        Same as check_stats_for_file but checks aggregated stats of a given
        project.
        """
        status_index = self.__column_number_for_status(str(status))

        # The table storing projects aggregated statistics is the 2nd to appear
        # in the DHTML report.
        project_table = self.find_elements(By.XPATH, "//app-enumerable-table")[
            1
        ]
        project_stats = project_table.find_elements(
            By.XPATH, f".//div[text()='{project}']/ancestor::tr//td"
        )
        assert int(project_stats[status_index].text.split()[0]) == statistic

    def check_total_stat(self, status, statistic):
        """
        Same as check_stats_for_file, but checks aggregated total stats.
        """
        status_index = self.__column_number_for_status(str(status))
        total_table = self.find_elements(By.XPATH, "//app-enumerable-table")[0]
        total_stats = total_table.find_elements(
            By.XPATH, ".//div[text()='Total']/ancestor::tr//td"
        )
        assert int(total_stats[status_index].text.split()[0]) == statistic
