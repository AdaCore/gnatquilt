all: build

build: gnatquilt.gpr
	gprbuild -p -P $<

clean: gnatquilt.gpr
	gprclean -P $<
	rm -rf obj

distclean: clean
	rm -f gnatquilt
