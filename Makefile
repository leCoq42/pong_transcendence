NAME = ft_transcendence

DB_DATA = ${HOME}/data/postgres #?

DOCKER_COMPOSE = docker-compose -f ./docker-compose.yml

DOCKER = docker

all: up

test: down build up

up: build
	@mkdir -p $(DB_DATA)
	${DOCKER_COMPOSE} up -d

down:
	${DOCKER_COMPOSE} down

start:
	$(DOCKER_COMPOSE) start

stop:
	$(DOCKER_COMPOSE) stop

build:
	$(DOCKER_COMPOSE) build

nginx:
	docker exec -it nginx_transcendence bash

postgres:
	docker exec -it postgres_transcendence bash


clean:
	@docker stop $$(docker ps -qa) || true
	@docker rm $$(docker ps -qa) || true
	@docker rmi -f $$(docker images -qa) || true
	@docker volume rm $$(docker volume ls -q) || true
	@docker network rm $$(docker network ls -q) || true
	@rm -rf $(DB_DATA) || true

re: clean up

prune: clean
	@docker system prune -a --volumes -f

.PHONY: all up down start stop build clean re prune nginx postgres