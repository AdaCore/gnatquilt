from enum import Enum
import glob

from e3.main import Main
from e3.os.process import Run

# Create the main e3 process to store a log of the commands executed by the test
# script. As every test script will need to import this file (as it contains
# commonly use utilities), put this here.
m = Main()
m.parse_args()


class CoverageStatus(Enum):
    COVERED = 1
    PARTIALLY_COVERED = 2
    NOT_COVERED = 3
    EXEMPTED_WITH_VIOLATION = 4
    EXEMPTED_NO_VIOLATION = 5
    NOT_COVERABLE = 6
    UNDETERMINED_COVERAGE = 7
    EXEMPTED_UNDETERMINED_COVERAGE = 8

    def __str__(self):

        string_repr = {
            1: "Covered",
            2: "Partially Covered",
            3: "Not Covered",
            4: "Exempted with Violation",
            5: "Exempted no Violation",
            6: "Not Coverable",
            7: "Undetermined Coverage",
            8: "Exempted with Undetermined Coverage items",
        }
        return string_repr[self.value]


class Entities(Enum):
    Stmt = 1
    Decision = 2
    MCDC = 3
    UC_MCDC = 4
    Fun_Call = 5

    def __str__(self):
        if self is Entities.Fun_Call:
            return "Function and call"
        return self.name


def build_run_and_coverage(
    mode,
    project,
    level,
    mains,
    extra_instr_args=None,
    extra_gprbuild_args=None,
    extra_coverage_args=None,
):
    """
    Helper to produce an html report by running a gnatcov binary-traces
    based, or instrumentation-based workflow, depending on the parameter mode
    (bin-traces or src-traces) Configuration of the commands is done through the
    project, mains, level parameters. One can add extra switches to the gprbuild
    or the gnatcov coverage invocation with the extra* parameters.

    Note that for binary traces, the aarch64-elf target is picked by default and
    should not be overriden: this is the target we test binary traces for.
    """

    def to_list(some_list):
        if some_list is None:
            return []
        return some_list

    is_bin_trace = mode == "bin-traces"
    extra_gprbuild_args = to_list(extra_gprbuild_args)
    extra_instr_args = to_list(extra_instr_args)
    extra_coverage_args = to_list(extra_coverage_args)

    if is_bin_trace:
        Run(
            [
                "gprbuild",
                f"-P{project}",
                "--target=aarch64-elf",
                "--RTS=light-zynqmp",
                "-cargs",
                "-g",
                "-fdump-scos",
            ]
            + extra_gprbuild_args
        )
        for main in mains:
            Run(
                [
                    "gnatcov",
                    "run",
                    f"-P{project}",
                    "--target=aarch64-elf",
                    "--RTS=light-zynqmp",
                    f"--level={level}",
                    f"{main}",
                ]
            )
    else:
        # Instrument, build and run
        assert mode == "src-traces"
        Run(
            [
                "gnatcov",
                "instrument",
                f"-P{project}",
                f"--level={level}",
            ]
            + extra_instr_args
        )
        Run(
            [
                "gprbuild",
                f"-P{project}",
                "--src-subdirs=gnatcov-instr",
                "--implicit-with=gnatcov_rts",
            ]
            + extra_gprbuild_args
        )
        for main in mains:
            Run([main])

    # Produce a coverage report
    trace_pattern = "*.trace" if is_bin_trace else "*.srctrace"
    trace_files = glob.glob(trace_pattern)

    Run(
        [
            "gnatcov",
            "coverage",
            f"-P{project}",
            f"--level={level}",
            "--annotate=dhtml",
        ]
        + extra_coverage_args
        + trace_files
    )
