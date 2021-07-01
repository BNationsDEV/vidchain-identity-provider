# vidchain-identity-provider

This repository contains two packages:

- **identity-consent** contains the source code that handles requests coming from users and entities to perform authentication related operations.
- **hydra** contains the deployment descriptors for the OpenID Connect Provider [ORY Hydra](https://www.ory.sh/hydra/docs/).


## Development environment
### Prerequisites
Make sure you have installed all of the following prerequisites on your development machine:

* Docker - [Download & Install Docker](https://docs.docker.com/get-docker/)
* Docker Compose - [Install Docker Compose](https://docs.docker.com/compose/install/)
* Ory Hydra - [Install Ory Hydra for macOS](https://formulae.brew.sh/formula/ory-hydra)
* GNU Make - [Install GNU Make for macOS](https://formulae.brew.sh/formula/make#default)
* Node.js and NPM [Download & Install Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### Running dev environment
Use the Makefile located in the root folder of the repo

To show the options just type "make help", it will show you the options.
```bash
$ make help
```
Typing "make dev" it will execute the stage "dev" to build the dev environment as it's defined in the Makefile
```bash
$ make dev
```
To clean the environment type:
```bash
$ make clean
```
* Remove Docker containers
* Kill Hydra process
