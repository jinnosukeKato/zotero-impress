XPI_NAME := zotero-impress-dev.xpi
XPI_FILES := manifest.json bootstrap.js

.PHONY: all xpi clean

all: xpi

xpi: $(XPI_FILES)
	@zip -q -r $(XPI_NAME) $(XPI_FILES)
	@echo "Built $(XPI_NAME)"

clean:
	@rm -f $(XPI_NAME)
	@echo "Removed $(XPI_NAME)"
