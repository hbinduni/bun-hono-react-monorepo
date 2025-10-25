# Makefile for Bun + Hono + React Monorepo
# Build and push Docker images to GitHub Container Registry

.PHONY: help build-server build-client build-all push-server push-client push-all deploy login test dev

# Configuration
REGISTRY := ghcr.io
GITHUB_USER ?= $(shell echo $$GITHUB_USER)
GITHUB_TOKEN ?= $(shell echo $$GITHUB_TOKEN)
IMAGE_VERSION ?= latest
PROJECT_NAME ?= bun-hono-react-monorepo

# Image names
SERVER_IMAGE := $(REGISTRY)/$(GITHUB_USER)/$(PROJECT_NAME)-server
CLIENT_IMAGE := $(REGISTRY)/$(GITHUB_USER)/$(PROJECT_NAME)-client

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Bun + Hono + React Monorepo - Docker Image Management$(NC)"
	@echo ""
	@echo "$(YELLOW)Prerequisites:$(NC)"
	@echo "  export GITHUB_USER=your-github-username"
	@echo "  export GITHUB_TOKEN=your-github-token"
	@echo ""
	@echo "$(YELLOW)Usage:$(NC) make [target]"
	@echo ""
	@echo "$(YELLOW)Targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

check-env: ## Check required environment variables
	@echo "$(BLUE)Checking environment variables...$(NC)"
	@if [ -z "$(GITHUB_USER)" ]; then \
		echo "$(RED)Error: GITHUB_USER is not set$(NC)"; \
		echo "Run: export GITHUB_USER=your-github-username"; \
		exit 1; \
	fi
	@if [ -z "$(GITHUB_TOKEN)" ]; then \
		echo "$(RED)Error: GITHUB_TOKEN is not set$(NC)"; \
		echo "Run: export GITHUB_TOKEN=your-github-token"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ GITHUB_USER: $(GITHUB_USER)$(NC)"
	@echo "$(GREEN)✓ GITHUB_TOKEN: [REDACTED]$(NC)"
	@echo "$(GREEN)✓ IMAGE_VERSION: $(IMAGE_VERSION)$(NC)"

login: check-env ## Login to GitHub Container Registry
	@echo "$(BLUE)Logging in to GitHub Container Registry...$(NC)"
	@echo "$(GITHUB_TOKEN)" | docker login $(REGISTRY) -u $(GITHUB_USER) --password-stdin
	@echo "$(GREEN)✓ Successfully logged in to $(REGISTRY)$(NC)"

build-server: ## Build server Docker image
	@echo "$(BLUE)Building server image...$(NC)"
	docker build -f server/Dockerfile -t $(SERVER_IMAGE):$(IMAGE_VERSION) -t $(SERVER_IMAGE):latest .
	@echo "$(GREEN)✓ Server image built: $(SERVER_IMAGE):$(IMAGE_VERSION)$(NC)"

build-client: ## Build client Docker image (VITE_API_URL is now runtime!)
	@echo "$(BLUE)Building client image...$(NC)"
	docker build -f client/Dockerfile -t $(CLIENT_IMAGE):$(IMAGE_VERSION) -t $(CLIENT_IMAGE):latest .
	@echo "$(GREEN)✓ Client image built: $(CLIENT_IMAGE):$(IMAGE_VERSION)$(NC)"
	@echo "$(GREEN)✓ Note: VITE_API_URL is now configured at runtime via .env.production$(NC)"

build-all: build-server build-client ## Build all Docker images (server + client)
	@echo "$(GREEN)✓ All images built successfully$(NC)"

push-server: check-env ## Push server image to GitHub Container Registry
	@echo "$(BLUE)Pushing server image...$(NC)"
	docker push $(SERVER_IMAGE):$(IMAGE_VERSION)
	docker push $(SERVER_IMAGE):latest
	@echo "$(GREEN)✓ Server image pushed: $(SERVER_IMAGE):$(IMAGE_VERSION)$(NC)"

push-client: check-env ## Push client image to GitHub Container Registry
	@echo "$(BLUE)Pushing client image...$(NC)"
	docker push $(CLIENT_IMAGE):$(IMAGE_VERSION)
	docker push $(CLIENT_IMAGE):latest
	@echo "$(GREEN)✓ Client image pushed: $(CLIENT_IMAGE):$(IMAGE_VERSION)$(NC)"

push-all: push-server push-client ## Push all images to GitHub Container Registry
	@echo "$(GREEN)✓ All images pushed successfully$(NC)"

deploy: login build-all push-all ## Complete deployment workflow (login + build + push)
	@echo "$(GREEN)✓ Deployment complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Copy .env.production and docker-compose.yml to your VPS"
	@echo "  2. On VPS, run: docker compose pull && docker compose up -d"

clean: ## Remove local Docker images
	@echo "$(BLUE)Removing local images...$(NC)"
	-docker rmi $(SERVER_IMAGE):$(IMAGE_VERSION) $(SERVER_IMAGE):latest
	-docker rmi $(CLIENT_IMAGE):$(IMAGE_VERSION) $(CLIENT_IMAGE):latest
	@echo "$(GREEN)✓ Local images removed$(NC)"

info: ## Show image information
	@echo "$(BLUE)Image Information:$(NC)"
	@echo "  Registry:      $(REGISTRY)"
	@echo "  User:          $(GITHUB_USER)"
	@echo "  Project:       $(PROJECT_NAME)"
	@echo "  Version:       $(IMAGE_VERSION)"
	@echo ""
	@echo "$(YELLOW)Server Image:$(NC)"
	@echo "  $(SERVER_IMAGE):$(IMAGE_VERSION)"
	@echo "  $(SERVER_IMAGE):latest"
	@echo ""
	@echo "$(YELLOW)Client Image:$(NC)"
	@echo "  $(CLIENT_IMAGE):$(IMAGE_VERSION)"
	@echo "  $(CLIENT_IMAGE):latest"

# Development commands (local)
dev: ## Start local development environment
	bun dev

test: ## Run tests locally
	bun test
