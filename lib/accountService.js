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

module.exports = accountService;
