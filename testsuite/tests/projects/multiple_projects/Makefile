traces:
	gnatcov instrument -P p.gpr --level=stmt+mcdc --dump-trigger=atexit
	gprbuild -P p.gpr --src-subdirs=gnatcov-instr --implicit-with=gnatcov_rts -f
	GNATCOV_TRACE_FILE="t1.srctrace" obj/t1
	GNATCOV_TRACE_FILE="t2.srctrace" obj/t2

coverage:
	gnatcov coverage --level=stmt+mcdc -P p.gpr --annotate=dhtml --output-dir=dhtml *.srctrace

clean:
	rm -rf obj* dhtml *.srctrace
