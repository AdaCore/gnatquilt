#!/usr/bin/env python

import os
import sys

from e3.os.process import Run

import e3.testsuite
from e3.testsuite.driver.diff import ClassicTestDriver
from e3.testsuite.testcase_finder import ParsedTest, TestFinder


class TestBashDriver(ClassicTestDriver):
    def run(self):
        self.shell(["bash", "test.sh"])


class TestPyDriver(ClassicTestDriver):
    def run(self):
        # Add current directory in PYTHONPATH, allowing Python testcase scripts
        # to find the coverage and webdriver modules.
        self.env.add_search_path("PYTHONPATH", self.env.root_dir)
        self.shell([sys.executable, self.test_dir("test.py")])


class GNATquiltTestFinder(TestFinder):
    def probe(self, testsuite, dirpath, dirnames, filenames):
        # If directory contains a "test.sh" file, this is a regular testcase
        if "test.py" in filenames:
            driver_cls = TestPyDriver
        else:
            driver_cls = None
        if driver_cls:
            return ParsedTest(
                test_name=testsuite.test_name(dirpath),
                driver_cls=driver_cls,
                test_env={},
                test_dir=dirpath,
            )


class TestSuite(e3.testsuite.Testsuite):

    tests_subdir = "tests"

    @property
    def test_finders(self):
        return [GNATquiltTestFinder()]

    def set_up(self):
        """
        GNATquilt relies on js files produced by gnatcov. As several GNATquilt
        tests share the same Ada sources, we actually don't host them under the
        test itself, but under a top level tests/projects directory.

        Each of the subdirectory is an Ada project with a Makefile running the
        various command to produce the traces.

        We don't want to immediately generate the dhtml report, as tests might
        run a custom coverage command.
        """

        super().set_up()
        top_dir = os.getcwd()
        for root, _dirs, _files in os.walk(
            os.path.join("tests", "projects"), topdown=True
        ):
            os.chdir(root)
            if os.path.isfile("Makefile"):
                Run(["make", "traces"])
            os.chdir(top_dir)

    def tear_down(self):
        super().tear_down()
        if self.main.args.enable_cleanup:
            top_dir = os.getcwd()
            for root, _dirs, _files in os.walk(
                os.path.join("tests", "projects"), topdown=True
            ):
                os.chdir(root)
                if os.path.isfile("Makefile"):
                    Run(["make", "clean"])
                os.chdir(top_dir)


testsuite = TestSuite()

if __name__ == "__main__":
    sys.exit(testsuite.testsuite_main())
