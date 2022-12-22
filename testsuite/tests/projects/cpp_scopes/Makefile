traces:
	gnatcov instrument --restricted-to-languages=C++ --level=stmt --dump-channel=bin-file --dump-trigger=atexit -P test.gpr
	gprbuild -P test.gpr --src-subdirs=gnatcov-instr --implicit-with=gnatcov_rts main.cpp -f
	GNATCOV_TRACE_FILE="main.srctrace" ./main

coverage:
	gnatcov coverage --annotate=dhtml --level=stmt -P test.gpr --trace=main.srctrace --output-dir=dhtml

clean:
	rm -rf obj* dhtml *.srctrace *.sid gnatcov_rts_* libtest* b__* main.o main main.bexch main.cpp.* main.d test-gnatcov-instr gnatcov-instr.json
