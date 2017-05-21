# Tink Labs coding test

## Restful API
All the following API respond with status code `2XX` as successfully carry out the action, while `4XX` as failure with corresponding error message.

path: `/account`
method: `PUT`
body:
```json
"owner": {
	"id": "123"
}
```
or
```json
"owner": {
	"name": "Leo Lo"
}
```
respond:
```json
"account": {
	"ownerId": "123",
	"id": "456",
	"balance": "0"
}
```
description: Create an account for owner specified. If `owner.id` is provided, the newly created account will be associated. If no `owner.id` is provided but `owner.name` instead, a new owner will be created and the newly created account will be associated with the newly created owner. The responds object is same as the account retrieval `GET` method below.

path: `/account/:accountId`
method: `GET`
respond:
```json
"account": {
	"ownerId": "123",
	"id": "456",
	"balance": "789.01"
}
```
description: Retrieve account information, including balance.

path: `/account/:accountId`
method: `DELETE`
description: Deactivate account.

path: `/account/deposit/:accountId`
method: `UPDATE`
body:
```json
"amount": 4000
```
description: Deposit the specified amount of money into account.

path: `/account/withdraw/:accountId`
method: `UPDATE`
body:
```json
"amount": 4000
```
description: Withdraw the specified amount of money from account.

path: `/account/transfer/:accountId`
method: `UPDATE`
body:
```json
"amount": 4000,
"toAccoundId": 456
```
description: Transfer the specified amount of money to another account. The transaction is subject to following constrains:
- 10000 daily transfer out limit
- 100 charge if transfer across different owners
- external approval of `http://handy.travel/test/success.json`

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
