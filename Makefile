APP_PATH?=$(shell pwd)

export APP_PATH

.PHONY: help build stop clean

help:
	@echo "######################"
	@echo "# Makefile arguments #"
	@echo "######################"
	@echo "dev"
	@echo "	Creation of the development environment"
	@echo "clean"	
	@echo "	Delete the containers and hydra"


.DEFAULT_GOAL := help


dev: clean redis containers hydra identity-consent

containers:
	@echo "Creating containers..."
	- @docker-compose -p vidchain_identity_provider -f packages/hydra/local/local-environment.yml up --build -d 
	- sleep 60 #hydra needs to set up

hydra:
	@echo "Creating hydra client..."
	- @hydra clients create --endpoint http://127.0.0.1:9001 --id cityEx1 --name Example of City1 --secret secret --grant-types authorization_code,refresh_token --response-types code,id_token --scope openid,VerifiableIdCredential,VidGoogleCredential,EmailCredential --callbacks http://127.0.0.1:9010/callback
	- sleep 5
	@echo "Running the hydra client..."
	- @hydra token user --skip-tls-verify --endpoint http://127.0.0.1:9001 --port 9010 --auth-url http://127.0.0.1:9000/oauth2/auth --token-url http://127.0.0.1:9000/oauth2/token --client-id cityEx1 --client-secret secret --scope openid,VerifiableIdCredential,EmailCredential &

identity-consent: 
	@echo "Starting identity-consent..."
	-@npm run start:dev --prefix ./packages/identity-consent


clean: | kill-hydra-process
	@echo "Cleaning up..."
	- @docker rm -f $(shell docker container ls --filter name=vidchain_identity_provider -qa) > /dev/null 2>&1

kill-hydra-process:
	- kill $(shell netstat -anvp tcp | awk 'NR<3 || /LISTEN/' | grep 9010 | awk '{print $$9}')

redis:
	@echo "Creating redis container..."
	- @docker run -d --name vidchain_identity_provider_redis -p 6379:6379 redis

logs:
	-@docker-compose -p vidchain_identity_provider -f packages/hydra/local/local-environment.yml logs --follow

