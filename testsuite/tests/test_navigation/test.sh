#!/bin/bash

gnatcov instrument -P p.gpr --level=stmt+mcdc --dump-trigger=atexit
gprbuild -P p.gpr --src-subdirs=gnatcov-instr --implicit-with=gnatcov_rts_full -f
GNATCOV_TRACE_FILE="t1.srctrace" obj/t1
GNATCOV_TRACE_FILE="t2.srctrace" obj/t2
gnatcov coverage --level=stmt+mcdc --annotate=dhtml --output-dir=dhtml -P p.gpr t1.srctrace t2.srctrace
pytest
