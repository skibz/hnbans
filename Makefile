
hnbans.zip: *.js *.png
	MANIFEST=$$(jq -M '. += {"manifest_version": 3}' < manifest.template.json) && \
	echo $$MANIFEST > manifest.json && \
	zip $@ $^ manifest.json

.PHONY: clean
clean:
	-rm -rf *.zip manifest.json hnbans-firefox hnbans-chrome