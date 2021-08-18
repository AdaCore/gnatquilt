traces:
	gnatcov instrument -P p.gpr --level=stmt+mcdc --dump-trigger=atexit
	gprbuild -P p.gpr --src-subdirs=gnatcov-instr --implicit-with=gnatcov_rts_full -f
	GNATCOV_TRACE_FILE="t1.srctrace" obj/t1
	GNATCOV_TRACE_FILE="t2.srctrace" obj/t2

clean:
	rm -rf obj* dhtml *.srctrace
