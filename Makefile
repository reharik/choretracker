APP_NAME := chore-tracker
ENV_NAME ?= dev
COMPOSE_PROJECT_NAME := $(APP_NAME)-$(ENV_NAME)

BASE_FILES := -f infra/config/docker-compose/base.yml

DEV_FILES := \
	-f infra/config/docker-compose/dev.yml \
	-f docker-compose/docker-compose.dev.yml

define compose_dev
APP_NAME=$(APP_NAME) \
COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) \
docker compose --project-directory $(CURDIR) $(BASE_FILES) $(DEV_FILES)
endef

docker/up/dev:
	$(compose_dev) up --build;

docker/down/dev:
	$(compose_dev) down --rmi local --remove-orphans --volumes
