include Makefile.conf

all: deps check bundle

bundle: $(BUILD)/obj/$(JS_TARGET_VERSION) $(BUILD)/obj/$(CSS_TARGET_VERSION)
	$(RMDIR) $(BUNDLE)
	$(MKDIR) $(BUNDLE)
	$(CP) $(BUILD)/obj/$(JS_TARGET_VERSION) $(BUNDLE)/$(JS_TARGET)
	$(CP) $(BUILD)/obj/$(CSS_TARGET_VERSION) $(BUNDLE)/$(CSS_TARGET)

3rdparties: $(BUILD)/.3rdparties

$(BUILD)/.3rdparties:
	(cd thirdparties && python thirdparties.py)
	chmod +x $(TOOLS_DIR)/bin/lessc
	$(MKDIR) $(BUILD)
	touch "$@"

check: $(BUILD)/.gjslint

$(BUILD)/.gjslint: $(JS_SOURCES) $(BUILD)/.3rdparties
	$(MKDIR) $(BUILD)/obj
	$(JS_LINTER) $(JS_LINTER_OPTIONS) $(SOURCE_DIR)/js
	touch "$@"

deps: $(BUILD)/obj/$(JS_DEPS_TARGET)

$(BUILD)/obj/$(JS_DEPS_TARGET): $(JS_SOURCES) $(BUILD)/.3rdparties
	$(MKDIR) $(BUILD)/obj
	$(JS_DEPS_GENERATOR) $(JS_DEPS_GENERATOR_OPTIONS) "--output_file=$@"

js: $(BUILD)/obj/$(JS_TARGET_VERSION)

$(BUILD)/obj/$(JS_TARGET_VERSION): $(JS_SOURCES) $(BUILD)/.3rdparties
	$(MKDIR) $(BUILD)/obj
	$(JS_COMPILER) $(JS_COMPILER_OPTIONS) "--output_file=$@"

css: $(BUILD)/obj/$(CSS_TARGET_VERSION)

$(BUILD)/obj/$(CSS_TARGET_VERSION): $(LESS_SOURCE_MAIN) $(LESS_SOURCES) $(BUILD)/.3rdparties
	$(MKDIR) $(BUILD)/obj
	$(LESS_COMPILER) $(LESS_COMPILER_OPTIONS) "$<" "$@"

clean:
	$(RM) $(BUILD)/obj/$(CSS_TARGET_VERSION)
	$(RM) $(BUILD)/obj/$(JS_TARGET_VERSION)
	$(RM) $(BUILD)/obj/$(JS_DEPS_TARGET)

distclean: clean
	$(RMDIR) $(BUILD)
	(cd thirdparties && python thirdparties.py distclean)
	find . -type f -name '*.pyc' -exec rm -f {} \;
