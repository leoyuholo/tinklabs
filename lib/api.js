const _ = require('lodash');
const express = require('express');

const ownerService = require('./ownerService');
const accountService = require('./accountService');

const api = express.Router();

api.put('/account', (req, res) => {
	const owner = req.body.owner;

	var ownerIdPromise = null;

	if (owner.id)
		ownerIdPromise = Promise.resolve(owner.id);
	else if (owner.name)
		ownerIdPromise = ownerService.create(owner.name).then(owner => owner.id);
	else
		return res.status(400).send('Invalid owner information.');

	ownerIdPromise
		.then(ownerId => accountService.create(ownerId))
		.then(account => {
			const reply = {
				account: _.pick(account, ['ownerId', 'id', 'balance'])
			};

			res.status(200).send(reply);
		})
		.catch(err => {
			console.log(`errors raised with path ${req.path} with message ${err.message}`, err.stack);

			res.status(500).send();
		});
});

api.get('/account/:accountId', (req, res) => {
	const accountId = req.params.accountId;

	if (!accountId || !_.isNumber(accountId))
		return res.status(400).send('Invalid account ID.');

	accountService.find(accountId)
		.then(account => {
			const reply = {
				account: _.pick(account, ['ownerId', 'id', 'balance'])
			};

			res.status(200).send(reply);
		})
		.catch(err => {
			console.log(`errors raised with path ${req.path} with message ${err.message}`);

			res.status(500).send();
		});
});

module.exports = api;
