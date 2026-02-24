.PHONY: all
all: ci

.PHONY: ci
ci: install test

.PHONY: install
install:
	npm ci
	npm install --no-save ../liflig-cdk-cloudfront-auth-0.0.0-development.tgz

.PHONY: test
test:
	npm run test
