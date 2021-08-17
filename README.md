# Gnatquilt

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.1.5.

## Install dependencies
Run `npm install` to install node dependencies.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

Note that GNATquilt in development mode expects generated files to be in the directory `src/test/dhtml`.

If you want to test changes made to GNATquilt, the easiest way is to generate a dhtml report, using the Makefile
under `src/test`, with the appropriate coverage level (that can be set directly in the Makefile), and then using target
`run` or `instrument` (depending on the coverage level).

Note that the `run` target does not use the two traces produced by the execution, to be compatible with the `insn`
level. It is thus expected to have different coverage result than with target `instrument`.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Documentation

run `compodoc -p tsconfig.app.json` followed by `compodoc -s` to have a browsable documentation.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
