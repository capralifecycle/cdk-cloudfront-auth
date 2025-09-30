.PHONY: all
all: build

.PHONY: build
build:
	# --ignore-scripts to ignore husky triggers for explicit build
	npm install --ignore-scripts
	npm run lint
	npm run build
	npm run test

.PHONY: snapshots
snapshots:
	npm run test -- --updateSnapshot

.PHONY: lint
lint:
	npm run lint

.PHONY: lint-fix
lint-fix:
	npm run lint:fix

.PHONY: fmt
fmt:
	npm run fmt

.PHONY: upgrade-deps
upgrade-deps:
	npm run upgrade-deps
