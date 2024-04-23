"""
Test the reporting on entities features for C/C++.
"""

import os

from selenium.webdriver.common.by import By

from coverage import build_run_and_coverage, CoverageStatus, Entities
from webdriver import FirefoxDriver

with FirefoxDriver() as driver:
    build_run_and_coverage(
        "src-traces",
        "test.gpr",
        "stmt",
        ["obj/main"],
        extra_instr_args=["--restricted-to-languages=C++"],
    )

    # Check subprogram metrics values
    # Lines

    # main.cpp

    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "main.cpp").click()

    driver.check_subp_stat("main.cpp", CoverageStatus.COVERED, 20)
    driver.check_subp_stat("main.cpp", CoverageStatus.NOT_COVERED, 4)

    driver.check_subp_stat("MyTClass", CoverageStatus.COVERED, 2)
    driver.check_subp_stat("MyTClass", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("MyTClass<T>", CoverageStatus.COVERED, 1)

    driver.check_subp_stat("~MyTClass<T>", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("method_one", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("MyClass", CoverageStatus.NOT_COVERED, 1)
    driver.check_subp_stat("method_two", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("template_function", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("normal_function", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("my_namespace", CoverageStatus.COVERED, 3)
    driver.check_subp_stat("my_namespace", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("function_in_namespace", CoverageStatus.COVERED, 1)

    driver.check_subp_stat("Anonymous namespace", CoverageStatus.COVERED, 2)

    driver.check_subp_stat("named_namespace_again", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("another_one", CoverageStatus.COVERED, 1)
    driver.check_subp_stat(
        "function_in_anonymous_namespace", CoverageStatus.COVERED, 1
    )

    driver.check_subp_stat(
        "Anonymous namespace", CoverageStatus.NOT_COVERED, 1, n=2
    )

    driver.check_subp_stat(
        "in_second_anonymous_namespace", CoverageStatus.NOT_COVERED, 1
    )

    driver.check_subp_stat("main", CoverageStatus.COVERED, 14)

    # Check that there are no scope metrics for a lambda expression, which is
    # by definition unamed, and thus does not have a scope name).
    assertion_error = False
    try:
        driver.find_subp_tr("")
    except AssertionError:
        assertion_error = True
    assert assertion_error, "Scope metrics for lambda expression"

    # Check the other files

    def check_metrics(file, func, covered, not_covered, stmt=False):
        driver.get("file://" + os.getcwd() + "/obj/index.html")
        driver.find_element(By.LINK_TEXT, file).click()

        if stmt:
            driver.report_on_entities([Entities.Stmt])

        driver.check_subp_stat(file, CoverageStatus.COVERED, covered)
        driver.check_subp_stat(file, CoverageStatus.NOT_COVERED, not_covered)
        driver.check_subp_stat(func, CoverageStatus.COVERED, covered)

    def check_files(stmt=False):
        check_metrics("bar.hh", "function_in_header", 4, 1)  # bar.hh
        check_metrics("foo.cpp", "use_pkg", 1, 0)  # foo.cpp
        check_metrics("pkg.cpp", "decl_in_header", 2, 0)  # pkg.cpp

    check_files()

    # Stmt

    # main.cpp

    driver.get("file://" + os.getcwd() + "/obj/index.html")
    driver.find_element(By.LINK_TEXT, "main.cpp").click()

    driver.report_on_entities([Entities.Stmt])

    driver.check_subp_stat("main.cpp", CoverageStatus.COVERED, 21)
    driver.check_subp_stat("main.cpp", CoverageStatus.NOT_COVERED, 4)

    driver.check_subp_stat("MyTClass", CoverageStatus.COVERED, 2)
    driver.check_subp_stat("MyTClass", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("MyTClass<T>", CoverageStatus.COVERED, 1)

    driver.check_subp_stat("~MyTClass<T>", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("method_one", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("MyClass", CoverageStatus.NOT_COVERED, 1)
    driver.check_subp_stat("method_two", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("template_function", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("normal_function", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("my_namespace", CoverageStatus.COVERED, 3)
    driver.check_subp_stat("my_namespace", CoverageStatus.NOT_COVERED, 1)

    driver.check_subp_stat("function_in_namespace", CoverageStatus.COVERED, 1)

    driver.check_subp_stat("Anonymous namespace", CoverageStatus.COVERED, 2)

    driver.check_subp_stat("named_namespace_again", CoverageStatus.COVERED, 1)
    driver.check_subp_stat("another_one", CoverageStatus.COVERED, 1)
    driver.check_subp_stat(
        "function_in_anonymous_namespace", CoverageStatus.COVERED, 1
    )

    driver.check_subp_stat(
        "Anonymous namespace", CoverageStatus.NOT_COVERED, 1, n=2
    )
    driver.check_subp_stat(
        "in_second_anonymous_namespace", CoverageStatus.NOT_COVERED, 1
    )

    driver.check_subp_stat("main", CoverageStatus.COVERED, 15)

    # Check that navigation links work (navigate to a subprogram correctly
    # scrolls down to it).

    subp_clicked = "normal_function"
    driver.navigate_to_subp(subp_clicked)
    found = False
    for source_line_td in driver.find_elements(
        By.CLASS_NAME, "xcov-source-row-text"
    ):
        if source_line_td.find_elements(
            By.XPATH, f"./div[contains(., 'int {subp_clicked}(int x)')]"
        ):
            found = True
            break

    assert found

    # Check that when navigating to the scope of the second anonymous
    # namespace we end up navigating to the right one (just before the main
    # function).

    subp_clicked = "Anonymous namespace"
    driver.navigate_to_subp(subp_clicked, 2)
    found = False
    for source_line_td in driver.find_elements(
        By.CLASS_NAME, "xcov-source-row-text"
    ):
        if source_line_td.find_elements(
            By.XPATH, "./div[contains(., 'int main()')]"
        ):
            found = True
            break

    assert found

    check_files(stmt=True)
