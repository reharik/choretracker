APP_NAME := network
ENV_NAME ?= dev
COMPOSE_PROJECT_NAME := $(APP_NAME)-$(ENV_NAME)

BASE_FILES := -f infra/config/docker-compose/base.yml

DEV_FILES := \
	-f infra/config/docker-compose/dev.yml \
	-f docker-compose/docker-compose.dev.yml

LOCAL_PROD_FILES := \
	-f infra/config/docker-compose/dev.yml \
	-f docker-compose/docker-compose-local-prod.yml \
	-f docker-compose/docker-compose.dev.yml

PROD_FILES := \
	-f infra/config/docker-compose/prod.yml

define compose_dev
APP_NAME=$(APP_NAME) \
COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) \
docker compose $(BASE_FILES) $(DEV_FILES)
endef

define compose_local_prod
APP_NAME=$(APP_NAME) \
COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) \
docker compose $(BASE_FILES) $(LOCAL_PROD_FILES)
endef

docker/up/dev:
	$(compose_dev) up --build;

docker/down/dev:
	$(compose_dev) down --rmi local --remove-orphans --volumes

docker/up/local-prod:
	$(compose_local_prod) up --build;


docker/down/local-prod:
	$(compose_local_prod) down --rmi local --remove-orphans --volumes
