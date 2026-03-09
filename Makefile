.PHONY: all
all: build

.PHONY: build
build: install fix test bun-build

.PHONY: ci
ci: install check test bun-build

.PHONY: install
install:
ifeq ($(CI),true)
	bun ci
else
	bun install
endif

.PHONY: fix
fix:
	bun run fix

.PHONY: check
check:
	bun run check

.PHONY: clean
clean:
	rm -rf dist lib

.PHONY: bun-build
bun-build:
	bun run build

.PHONY: test
test:
	bun run test -- --updateSnapshot

.PHONY: upgrade-deps
upgrade-deps:
	bun run upgrade-deps
