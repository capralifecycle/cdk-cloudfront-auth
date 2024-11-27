.PHONY: all
all: build

.PHONY: build
build: install-parent-pkg test

.PHONY: install-parent-pkg
install-parent-pkg:
	cd .. && npm pack
	npm install
	npm install --no-save ../liflig-cdk-cloudfront-auth-0.0.0-development.tgz

.PHONY: test
test:
	npm run test
