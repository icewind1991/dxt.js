src/squish.js: $(wildcard squish/*)

test/bundle.js: src/dxt.js src/squish.js test/browser-test.js
	node_modules/.bin/browserify test/browser-test.js -o test/bundle.js

browser-test: test/bundle.js

test: src/dxt.js src/squish.js test/browser-test.js
	node_modules/mocha/bin/_mocha --ui bdd test/test.js

all: src/squish.js

.PHONY: test browser-test
