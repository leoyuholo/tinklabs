const _ = require('lodash');
const express = require('express');

const ownerService = require('./ownerService');
const accountService = require('./accountService');

const api = express.Router();

api.put('/account', (req, res) => {
	const owner = req.body.owner;

	let ownerIdPromise = null;

	if (owner.id)
		ownerIdPromise = Promise.resolve(owner.id);
	else if (owner.name)
		ownerIdPromise = ownerService.create(owner.name).then(newOwner => newOwner.id);
	else
		return res.status(400).send('Invalid owner information.');

	return ownerIdPromise
		.then(ownerId => accountService.create(ownerId))
		.then((account) => {
			const reply = {
				account: _.pick(account, ['ownerId', 'id', 'balance'])
			};

			res.status(200).send(reply);
		});
});

api.get('/account/:accountId', (req, res) => {
	const accountId = req.params.accountId;

	if (!accountId || !_.isNumber(+accountId))
		return res.status(400).send('Invalid account ID.');

	return accountService.find(accountId)
		.then((account) => {
			if (!account) return res.status(404).send();

			const reply = {
				account: _.pick(account, ['ownerId', 'id', 'balance'])
			};

			return res.status(200).send(reply);
		});
});

api.delete('/account/:accountId', (req, res) => {
	const accountId = req.params.accountId;

	if (!accountId || !_.isNumber(+accountId))
		return res.status(400).send('Invalid account ID.');

	return accountService.deactivate(accountId)
		.then(() => res.status(200).send());
});

api.post('/account/deposit/:accountId', (req, res) => {
	const accountId = req.params.accountId;
	const amount = req.body.amount;

	if (!accountId || !_.isNumber(+accountId))
		return res.status(400).send('Invalid account ID.');

	if (!amount || !_.isNumber(amount) || amount <= 0)
		return res.status(400).send('Invalid deposit amount.');

	return accountService.deposit(accountId, amount)
		.then((success) => {
			if (success) res.status(200).send();
			else res.status(404).send();
		});
});

api.post('/account/withdraw/:accountId', (req, res) => {
	const accountId = req.params.accountId;
	const amount = req.body.amount;

	if (!accountId || !_.isNumber(+accountId))
		return res.status(400).send('Invalid account ID.');

	if (!amount || !_.isNumber(amount) || amount <= 0)
		return res.status(400).send('Invalid withdrawal amount.');

	return accountService.withdraw(accountId, amount)
		.then((success) => {
			if (success) res.status(200).send();
			else res.status(400).send('Account does not exist or without sufficient deposit.');
		});
});

api.post('/account/transfer/:accountId', (req, res) => {
	const accountId = req.params.accountId;
	const toAccountId = req.body.toAccountId;
	const amount = req.body.amount;

	if (!accountId || !_.isNumber(+accountId))
		return res.status(400).send('Invalid account ID.');

	if (!toAccountId || !_.isNumber(toAccountId))
		return res.status(400).send('Invalid account ID.');

	if (!amount || !_.isNumber(amount) || amount <= 0)
		return res.status(400).send('Invalid withdrawal amount.');

	return accountService.transfer(accountId, toAccountId, amount)
		.then(({ success, reason }) => {
			if (success) res.status(200).send();
			else res.status(400).send(reason);
		});
});

module.exports = api;
