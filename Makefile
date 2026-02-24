.PHONY: all
all: build

.PHONY: build
build: install fix test npm-build

.PHONY: ci
ci: install check test npm-build

.PHONY: install
install:
ifeq ($(CI),true)
	npm ci
else
	npm install --ignore-scripts
endif

.PHONY: fix
fmt:
	npm run fix

.PHONY: check
check:
	npm run check

.PHONY: npm-build
npm-build:
	npm run build

.PHONY: test
test:
	npm run test -- --updateSnapshot

.PHONY: upgrade-deps
upgrade-deps:
	npm run upgrade-deps
