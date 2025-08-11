
lookup.hnbans-firefox.zip := 2
lookup.hnbans-chrome.zip := 3

hnbans-chrome.zip: *.js *.png
	MANIFEST=$$(jq -M '. += {"manifest_version": $(lookup.$@)}' < manifest.template.json) && \
	echo $$MANIFEST > manifest.json && \
	zip $@ $^ manifest.json

.PHONY: clean
clean:
	-rm -rf *.zip manifest.json hnbans-firefox hnbans-chrome