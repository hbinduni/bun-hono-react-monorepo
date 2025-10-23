# Makefile for User Feedback Application

.PHONY: help dev build up down logs clean test

help: ## Show this help message
	@echo "User Feedback Application - Docker Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

dev: ## Start development environment
	bun dev

build: ## Build Docker images
	docker-compose --env-file .env.production build

up: ## Start all services in production mode
	docker-compose --env-file .env.production up -d

down: ## Stop all services
	docker-compose --env-file .env.production down

restart: down up ## Restart all services

logs: ## Show logs from all services
	docker-compose --env-file .env.production logs -f

logs-server: ## Show server logs
	docker-compose --env-file .env.production logs -f server

logs-client: ## Show client logs
	docker-compose --env-file .env.production logs -f client

logs-db: ## Show database logs
	docker-compose --env-file .env.production logs -f postgres

ps: ## Show running containers
	docker-compose --env-file .env.production ps

clean: ## Remove containers, volumes, and images
	docker-compose --env-file .env.production down -v --rmi all

clean-volumes: ## Remove only volumes
	docker-compose --env-file .env.production down -v

shell-server: ## Open shell in server container
	docker-compose --env-file .env.production exec server sh

shell-db: ## Open psql in database container
	docker-compose --env-file .env.production exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

test: ## Run tests
	bun test

db-migrate: ## Run database migrations
	docker-compose --env-file .env.production exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f /docker-entrypoint-initdb.d/01-schema.sql

db-seed: ## Seed database
	docker-compose --env-file .env.production exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f /docker-entrypoint-initdb.d/02-seed.sql
