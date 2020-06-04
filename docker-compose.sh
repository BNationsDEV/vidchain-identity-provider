#!/bin/sh

docker-compose -f docker-compose-dbs.yml \
               -f packages/hydra/hydra-dev.yml \
               -f packages/identity-consent/docker-compose.yml \
               up -d
