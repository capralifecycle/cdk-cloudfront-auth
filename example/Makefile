.PHONY: ci
ci: install test

.PHONY: install
install:
	bun ci
	rm -rf node_modules/@liflig/cdk-cloudfront-auth
	mkdir -p node_modules/@liflig/cdk-cloudfront-auth
	tar -xzf ../liflig-cdk-cloudfront-auth-0.0.0-development.tgz --strip-components=1 -C node_modules/@liflig/cdk-cloudfront-auth

.PHONY: test
test:
	bun run test
