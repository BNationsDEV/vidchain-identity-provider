#!/bin/sh

docker-compose -f docker-compose-dbs.yml up -d
docker-compose -f packages/hydra/hydra-prod.yml up -d
docker-compose -f packages/identity-consent/docker-compose.yml up -d --build