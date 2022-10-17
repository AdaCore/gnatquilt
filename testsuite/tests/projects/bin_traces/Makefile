traces:
	gprbuild --target=aarch64-elf --RTS=light-zynqmp -P p.gpr -cargs -g -fdump-scos -fpreserve-control-flow
	gnatcov run -P p.gpr --level=stmt+mcdc --target=aarch64-elf --RTS=light-zynqmp obj/main

clean:
	rm -rf obj* dhtml *.srctrace
