#!/usr/bin/env python

import sys

import e3.testsuite
from e3.testsuite.driver.diff import ClassicTestDriver
from e3.testsuite.testcase_finder import ParsedTest, TestFinder


class TestBashDriver(ClassicTestDriver):
    def run(self):
        self.shell(["bash", "test.sh"])


class GNATquiltTestFinder(TestFinder):
    def probe(self, testsuite, dirpath, dirnames, filenames):
        # If directory contains a "test.sh" file, this is a regular testcase
        if 'test.sh' in filenames:
            driver_cls = TestBashDriver
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


if __name__ == "__main__":
    sys.exit(TestSuite().testsuite_main())
