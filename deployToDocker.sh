#!/bin/bash

deno run build
docker compose -f tests/docker-compose.yaml down
docker compose -f tests/docker-compose.yaml up -d
docker exec tls-configurator-apache rm -rf /tmp/make-secure
docker exec tls-configurator-apache mkdir -p /tmp/make-secure
docker cp bin tls-configurator-apache:/tmp/make-secure
