from enum import Enum
import glob
import os

from testsuite import testsuite

from e3.os.process import Run


class CoverageStatus(Enum):
    COVERED = 1
    PARTIALLY_COVERED = 2
    NOT_COVERED = 3
    EXEMPTED_WITH_VIOLATION = 4
    EXEMPTED_NO_VIOLATION = 5
    NOT_COVERABLE = 6
    NOT_INSTRUMENTED = 7

    def __str__(self):

        string_repr = {
            1: "Covered",
            2: "Partially Covered",
            3: "Not Covered",
            4: "Exempted with Violation",
            5: "Exempted no Violation",
            6: "Not Coverable",
            7: "Not Instrumented"
        }
        return string_repr[self.value]


class Entities(Enum):
    Stmt = 1
    Decision = 2
    MCDC = 3
    UC_MCDC = 4

    def __str__(self):
        return self.name


def make_dhtml_report(project, project_name, output_dir, level="stmt+mcdc"):
    project_dir = os.path.join(testsuite.test_dir, "projects", project)
    assert os.path.isdir(project_dir)

    binary_traces = glob.glob(f"{project_dir}/*.trace")
    source_traces = glob.glob(f"{project_dir}/*.srctrace")

    if len(binary_traces) > 0 and len(source_traces) > 0:
        raise RuntimeError(
            "Found traces of different kinds in project {}:"
            "\n{} and {}".format(
                project_name, ",".join(binary_traces), ",".join(source_traces)
            )
        )

    if len(binary_traces) == 0 and len(source_traces) == 0:
        raise RuntimeError("Found no traces in project {}".format(project_name))

    traces = source_traces if len(source_traces) > 0 else binary_traces

    p = Run(
        [
            "gnatcov",
            "coverage",
            f"-P{project_name}",
            "--annotate=dhtml",
            f"--level={level}",
            f"--output-dir={output_dir}",
        ]
        + traces,
        cwd=project_dir,
    )
    if p.status != 0:
        raise RuntimeError(
            "Execution of {} in working dir {} failed:"
            "\nOutput:"
            "\n{}".format(p.command_line_image(), project_dir, p.out)
        )
