include Makefile.conf

all: deps bundle

bundle: check js css
	rm -rf $(BUNDLE)
	mkdir -p $(BUNDLE)
	cp $(TEMPLATES)/index.html $(BUNDLE)/.
	cp $(JS_TARGET) $(BUNDLE)/.
	cp $(CSS_TARGET) $(BUNDLE)/.

3rdparties: $(BUILD)/.3rdparties

$(BUILD)/.3rdparties:
	(cd thirdparties && python thirdparties.py)
	mkdir -p $(BUILD)
	touch "$@"

check: $(BUILD)/.gjslint

$(BUILD)/.gjslint: $(JS_SOURCES) $(BUILD)/.3rdparties
	$(JS_LINTER) $(JS_LINTER_OPTIONS) $(SOURCE_DIR)/js
	touch "$@"

deps: $(JS_DEPS_TARGET)

$(JS_DEPS_TARGET): $(JS_SOURCES) $(BUILD)/.3rdparties
	$(JS_DEPS_GENERATOR) $(JS_DEPS_GENERATOR_OPTIONS) "--output_file=$@"

js: $(JS_TARGET)

$(JS_TARGET): $(JS_SOURCES) $(BUILD)/.3rdparties
	$(JS_COMPILER) $(JS_COMPILER_OPTIONS) "--output_file=$@"

css: $(CSS_TARGET)

$(CSS_TARGET): $(LESS_SOURCE_MAIN) $(LESS_SOURCES) $(BUILD)/.3rdparties
	$(LESS_COMPILER) "$<" "$@" $(LESS_COMPILER_OPTIONS)

clean:
	rm -f $(CSS_TARGET)
	rm -f $(JS_TARGET)
	rm -f $(JS_DEPS_TARGET)

distclean: clean
	rm -rf $(BUILD)
	(cd thirdparties && python thirdparties.py distclean)
	find . -type f -name '*.pyc' -exec rm -f {} \;
