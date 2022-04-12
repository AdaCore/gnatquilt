traces:
	gnatcov instrument -P p.gpr --level=stmt+mcdc --dump-trigger=atexit
	gprbuild -P p.gpr --src-subdirs=gnatcov-instr --implicit-with=gnatcov_rts -f
	GNATCOV_TRACE_FILE="main.srctrace" obj/main

clean:
	rm -rf obj* dhtml *.srctrace
