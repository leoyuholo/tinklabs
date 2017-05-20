# Tink Labs coding test

## Development
You are recommended to do development with [docker](https://store.docker.com/editions/community/docker-ce-server-ubuntu/plans/docker-ce-server-ubuntu-tier?tab=instructions) and [docker-compose](https://docs.docker.com/compose/install/) on Ubuntu.
To start development, simplily run `docker-compose up` to spin up the development environment.

For the first time spinning up database, run:
```
docker-compose exec db /bin/bash
```
to start a bash shell in postgres instance, then run:
```
psql -U postgres -a -f /sql/tables.sql
```
to create tables.
