const _ = require('lodash');

const db = require('./db');

const accountService = {};

accountService.create = (ownerId) => {
	return db.query('INSERT INTO accounts (owner_id) VALUES ($1) RETURNING id, owner_id, balance', [ownerId])
		.then(result => {
			const row = result.rows[0];
			return {
				ownerId: row.owner_id,
				id: row.id,
				balance: +_.trimStart(row.balance, '$')
			};
		});
};

accountService.find = (id) => {
	return db.query('SELECT id, owner_id, balance FROM accounts WHERE id=$1 and active=true', [id])
		.then(result => {
			if (result.rows.length === 0) return false;

			const row = result.rows[0];
			return {
				ownerId: row.owner_id,
				id: row.id,
				balance: +_.trimStart(row.balance, '$')
			};
		});
};

accountService.deactivate = (id) => {
	return db.query('UPDATE accounts SET active=false WHERE id=$1', [id])
		.then(result => Promise.resolve());
};

module.exports = accountService;
