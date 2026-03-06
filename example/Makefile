.PHONY: all
all: ci

.PHONY: ci
ci: install test

.PHONY: install
install:
	bun install --frozen-lockfile
	bun install --no-save ../liflig-cdk-cloudfront-auth-0.0.0-development.tgz

.PHONY: test
test:
	bun run test
