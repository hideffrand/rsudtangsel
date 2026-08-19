-include .env
export

MIGRATE_DIR := migrations
MIGRATE_ARGS := -path $(MIGRATE_DIR) -database $(DATABASE_URL)
MIGRATE ?= go run -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.1

.PHONY: help run build seed db-up db-down migrate-up migrate-down migrate-create migrate-version migrate-force install-migrate

help: ## list targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-16s %s\n", $$1, $$2}'

run: ## run the server
	go run .

build: ## build binary to bin/
	go build -o bin/server .

seed: ## seed doctor schedules from CSV + service catalog (truncates doctors/poliklinik)
	go run ./cmd/seed

db-up: ## start postgres via compose
	docker compose -f ../compose.yaml up -d db

db-down: ## stop postgres
	docker compose -f ../compose.yaml down

migrate-up: ## apply pending migrations
	$(MIGRATE) $(MIGRATE_ARGS) up

migrate-down: ## roll back one migration
	$(MIGRATE) $(MIGRATE_ARGS) down 1

migrate-create: ## create migration: make migrate-create name=add_users
	$(MIGRATE) create -ext sql -dir $(MIGRATE_DIR) $(name)

migrate-version: ## show current migration version
	$(MIGRATE) $(MIGRATE_ARGS) version

migrate-force: ## force a version: make migrate-force v=1
	$(MIGRATE) $(MIGRATE_ARGS) force $(v)

install-migrate: ## install migrate CLI to GOBIN
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.1
