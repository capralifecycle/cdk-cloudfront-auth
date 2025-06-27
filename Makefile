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

.PHONY: fix
fix:
	npm run lint:fix
