qa: analyze test

analyze:
	@npm run analyze

test:
	@npm run test

build:
	@npm run build

.PHONY: qa \
				analyze \
				test \
				build
