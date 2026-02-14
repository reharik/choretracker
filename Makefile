.PHONY: help build up down logs clean dev-up dev-down dev-logs db-migrate db-migrate-dev db-seed db-seed-dev

help:
	@echo "ChoreTracker Docker Commands"
	@echo "============================"
	@echo "Production:"
	@echo "  make build        - Build production images"
	@echo "  make up           - Start production containers"
	@echo "  make down         - Stop production containers"
	@echo "  make logs         - View production logs"
	@echo "  make db-migrate   - Run migrations in production container"
	@echo "  make db-seed      - Run seeds in production container"
	@echo ""
	@echo "Development:"
	@echo "  make dev-up       - Start development containers"
	@echo "  make dev-down     - Stop development containers"
	@echo "  make dev-logs     - View development logs"
	@echo "  make db-migrate-dev - Run migrations in dev container"
	@echo "  make db-seed-dev  - Run seeds in dev container"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Remove all containers and volumes"

# Production commands
build:
	docker compose -f docker-compose.yml build

up:
	docker compose -f docker-compose.yml up

down:
	docker compose -f docker-compose.yml down

logs:
	docker compose -f docker-compose.yml logs -f

# Development commands
dev-up:
	docker compose -f docker-compose-dev.yml up

dev-down:
	docker compose -f docker-compose-dev.yml down

dev-logs:
	docker compose -f docker-compose-dev.yml logs -f

# Database commands (Production)
db-migrate:
	docker compose -f docker-compose.yml exec api npm run db:migrate

db-seed:
	docker compose -f docker-compose.yml exec api npm run db:seed

# Database commands (Development)
db-migrate-dev:
	docker compose -f docker-compose-dev.yml exec api npm run db:migrate

db-seed-dev:
	docker compose -f docker-compose-dev.yml exec api npm run db:seed

# Maintenance
clean:
	docker compose -f docker-compose.yml down -v
	docker compose -f docker-compose-dev.yml down -v
