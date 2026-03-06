.PHONY: ci
ci: install test

.PHONY: install
install:
	bun ci
	tar -xzf ../liflig-cdk-cloudfront-auth-0.0.0-development.tgz -C node_modules/@liflig/cdk-cloudfront-auth

.PHONY: test
test:
	bun run test
