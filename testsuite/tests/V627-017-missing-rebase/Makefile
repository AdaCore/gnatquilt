all:
	gnatcov instrument -P instrument_project/prj.gpr --level=stmt+mcdc \
                     --dump-trigger=atexit
	gprbuild -P instrument_project/prj.gpr --implicit-with=gnatcov_rts \
           --src-subdirs=gnatcov-instr
	GNATCOV_TRACE_FILE="main.srctrace" instrument_project/obj/main
	mkdir -p coverage_project/obj
	cp instrument_project/obj/*.sid coverage_project/obj/
	gnatcov coverage -adhtml --output-dir=dhtml --level=stmt \
                   -P coverage_project/prj.gpr main.srctrace

clean:
	rm -rf coverage_project/obj instrument_project/obj* dhtml *.srctrace
