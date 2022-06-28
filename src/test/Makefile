COVERAGE_LEVEL="stmt+mcdc"

instrument:
	gnatcov instrument -P p.gpr --level=$(COVERAGE_LEVEL) --dump-trigger=atexit
	gprbuild -P p.gpr --src-subdirs=gnatcov-instr --implicit-with=gnatcov_rts.gpr -f
	GNATCOV_TRACE_FILE="t1.srctrace" obj/t1
	GNATCOV_TRACE_FILE="t2.srctrace" obj/t2
	gnatcov coverage --level=$(COVERAGE_LEVEL) --annotate=dhtml --output-dir=dhtml -P p.gpr t1.srctrace t2.srctrace

run:
	gprbuild -P p.gpr -cargs -fpreserve-control-flow -fdump-scos -g
	gnatcov run obj/t1
	gnatcov run obj/t2
	gnatcov coverage --level=$(COVERAGE_LEVEL) --annotate=dhtml --output-dir=dhtml -P p.gpr t1.trace
