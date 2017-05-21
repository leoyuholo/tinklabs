const _ = require('lodash');
const bluebird = require('bluebird');
const fetch = require('node-fetch');

const db = require('./db');

const accountService = {};

const moneyToNumber = (money) => +_.replace(_.trimStart(money, '$'), ',', '');

accountService.create = (ownerId) => {
	return db.query('INSERT INTO accounts (owner_id) VALUES ($1) RETURNING id, owner_id, balance', [ownerId])
		.then(result => {
			const row = result.rows[0];
			return {
				ownerId: row.owner_id,
				id: row.id,
				balance: moneyToNumber(row.balance)
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
				balance: moneyToNumber(row.balance)
			};
		});
};

accountService.deactivate = (id) => {
	return db.query('UPDATE accounts SET active=false WHERE id=$1', [id])
		.then(result => Promise.resolve());
};

accountService.deposit = (id, amount) => {
	return db.query('UPDATE accounts SET balance = balance + $2 WHERE id=$1 and active=true', [id, amount])
		.then(result => result.rowCount > 0);
};

accountService.withdraw = (id, amount) => {
	return db.query('UPDATE accounts SET balance = balance - $2 WHERE id=$1 and active=true and balance >= $2', [id, amount])
		.then(result => result.rowCount > 0);
};

class UserError extends Error {}
class ApprovalError extends Error {}

accountService.dailyLimit = 10000;
approvalUrl = 'http://handy.travel/test/success.json';

accountService.transfer = (fromAccountId, toAccountId, amount) => {
	if (amount > accountService.dailyLimit) return Promise.resolve({success: false, reason: 'Daily transfer limit exceeds.'});

	return bluebird.coroutine(function* () {
		const client = yield db.connect();
		try {
			const fromAccount = yield accountService.find(fromAccountId);
			if (!fromAccount) throw new UserError('Sender account does not exist.');

			const toAccount = yield accountService.find(toAccountId);
			if (!toAccount) throw new UserError('Recipient account does not exist.');

			const charge = fromAccount.ownerId === toAccount.ownerId ? 0 : 100;

			const approvalRespond = yield fetch(approvalUrl);
			const approvalJson = yield approvalRespond.json();
			if (approvalJson.status !== 'success') throw new ApprovalError('Transfer not approved.');

			yield client.query('BEGIN');

			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(startOfDay.getTime());
			endOfDay.setDate(endOfDay.getDate() + 1);

			const dailyTransferSumResult = yield client.query('SELECT coalesce(sum(amount), 0::numeric::money) as total FROM records WHERE account_id=$1 and created_at >= $2 and created_at < $3', [fromAccount.id, startOfDay, endOfDay])
			if (moneyToNumber(dailyTransferSumResult.rows[0].total) + amount > accountService.dailyLimit) throw new UserError('Daily transfer limit exceeds.')

			const withdrawalResult = yield client.query('UPDATE accounts SET balance = balance - $2 WHERE id=$1 and active=true and balance >= $2', [fromAccountId, amount + charge])
			if (withdrawalResult.rowCount < 1) throw new UserError('Sender account does not have sufficient deposit.');

			const depositResult = yield client.query('UPDATE accounts SET balance = balance + $2 WHERE id=$1 and active=true', [toAccountId, amount]);

			const recordResult = yield client.query('INSERT INTO records (account_id, to_account_id, amount, charge) VALUES ($1, $2, $3, $4) RETURNING account_id, to_account_id, amount', [fromAccountId, toAccountId, amount, charge])

			yield client.query('COMMIT');

			client.release();

			return {success: true};
		} catch (err) {
			client.release(true);

			if (err instanceof UserError || err instanceof ApprovalError) return {success: false, reason: err.message};
			else throw err;
		}
	})();
};

module.exports = accountService;
