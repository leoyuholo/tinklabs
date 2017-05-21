const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

const request = require('supertest');
const epxress = require('express');
const randomName = require('random-name');
const nock = require('nock');

const app = require('../lib/app');
const db = require('../lib/db');

describe('app', function () {
	describe('account', function () {
		describe('create', function () {
			it('should create an account', function () {
				return request(app)
					.put('/account')
					.send({owner: {name: 'leo'}})
					.expect(200)
					.then(res => {
						should.exist(res.body.account);
						const account = res.body.account;
						account.should.have.property('ownerId').that.is.a('number');
						account.should.have.property('id').that.is.a('number');
						account.should.have.property('balance').that.is.a('number');
					});
			});
		});

		describe('find', function () {
			it('should retrieve an account', function () {
				return request(app)
					.get('/account/1')
					.expect(200)
					.then(res => {
						should.exist(res.body.account);
						const account = res.body.account;
						account.should.have.property('ownerId').that.is.a('number');
						account.should.have.property('id').that.is.a('number');
						account.should.have.property('balance').that.is.a('number');
					});
			});

			it('should return 404', function () {
				return request(app)
					.get('/account/0')
					.expect(404);
			});
		});

		const createAccount = (ownerId = 1, ownerName) =>
			request(app)
				.put('/account')
				.send({owner: ownerName ? {name: ownerName} : {id: ownerId}})
				.expect(200)
				.then(res => res.body.account);

		describe('deactivate', function () {
			it('should deactivate an account', function () {
				return createAccount()
					.then(account =>
						request(app)
							.delete(`/account/${account.id}`)
							.expect(200)
							.then(() =>
								request(app)
									.get(`/account/${account.id}`)
									.expect(404)
							)
					);
			});
		});

		const deposit = (accountId, amount) =>
			request(app)
				.post(`/account/deposit/${accountId}`)
				.send({amount})
				.expect(200);

		const getBalance = (accountId) =>
			request(app)
				.get(`/account/${accountId}`)
				.then(res => res.body.account.balance);

		describe('deposit', function () {
			it('should deposit money into account', function () {
				return createAccount()
					.then(account =>
						deposit(account.id, 1000)
							.then(() => getBalance(account.id).should.eventually.equal(1000))
					);
			});

			it('should deposit more money into account', function () {
				return createAccount()
					.then(account =>
						deposit(account.id, 1000)
							.then(() => deposit(account.id, 500))
							.then(() => getBalance(account.id).should.eventually.equal(1500))
					);
			});

			it('should forfeit negative deposit', function () {
				return createAccount()
					.then(account =>
						request(app)
							.post(`/account/deposit/${account.id}`)
							.send({amount: -10})
							.expect(400)
					);
			});

			it('should forfeit zero deposit', function () {
				return createAccount()
					.then(account =>
						request(app)
							.post(`/account/deposit/${account.id}`)
							.send({amount: 0})
							.expect(400)
					);
			});
		});

		const withdraw = (accountId, amount) =>
			request(app)
				.post(`/account/withdraw/${accountId}`)
				.send({amount})
				.expect(200);

		describe('withdraw', function () {
			it('should forfeit negative withdrawal', function () {
				return createAccount()
					.then(account =>
						request(app)
							.post(`/account/withdraw/${account.id}`)
							.send({amount: -20})
							.expect(400)
					);
			});

			it('should forfeit zero withdrawal', function () {
				return createAccount()
					.then(account =>
						request(app)
							.post(`/account/withdraw/${account.id}`)
							.send({amount: 0})
							.expect(400)
					);
			});

			it('should withdraw money from account', function () {
				return createAccount()
					.then(account =>
						deposit(account.id, 1000)
							.then(() => withdraw(account.id, 500))
							.then(() => getBalance(account.id).should.eventually.equal(500))
					);
			});

			it('should fail to withdraw excess money from account', function () {
				return createAccount()
					.then(account =>
						deposit(account.id, 1000)
							.then(() =>
								request(app)
									.post(`/account/withdraw/${account.id}`)
									.send({amount: 5000})
									.expect(400)
							)
							.then(() => getBalance(account.id).should.eventually.equal(1000))
					);
			});
		});

		const transfer = (fromAccountId, toAccountId, amount, statusCode = 200) =>
			request(app)
				.post(`/account/transfer/${fromAccountId}`)
				.send({toAccountId, amount})
				.expect(statusCode);

		describe('transfer', function () {
			const approvalBaseUrl = 'http://handy.travel';
			const approvalPath = '/test/success.json';

			beforeEach(function () {
				nock(approvalBaseUrl)
					.persist()
					.get(approvalPath)
					.reply(200, {status: 'success'});
			});

			afterEach(function () {
				nock.cleanAll();
			});

			it('should transfer money to another account of same owner without charges', function () {
				return createAccount(null, randomName())
					.then(accountA => {
						return deposit(accountA.id, 1000000)
							.then(() => createAccount(accountA.ownerId))
							.then(accountB =>
								transfer(accountA.id, accountB.id, 8000)
									.then(() => getBalance(accountA.id).should.eventually.equal(992000))
									.then(() => getBalance(accountB.id).should.eventually.equal(8000))
							)
					});
			});

			it('should fail to transfer without sufficient deposit', function () {
				return createAccount(null, randomName())
					.then(accountA => {
						return deposit(accountA.id, 5000)
							.then(() => createAccount(accountA.ownerId))
							.then(accountB =>
								transfer(accountA.id, accountB.id, 6000, 400)
									.then(() => getBalance(accountA.id).should.eventually.equal(5000))
									.then(() => getBalance(accountB.id).should.eventually.equal(0))
							)
					});
			});

			it('should fail one of two transfers due to insufficient deposit', function () {
				const transferReportStatusCode = (fromAccountId, toAccountId, amount) =>
					request(app)
						.post(`/account/transfer/${fromAccountId}`)
						.send({toAccountId, amount})
						.then(res => res.statusCode);

				return createAccount(null, randomName())
					.then(accountA => {
						return deposit(accountA.id, 8000)
							.then(() =>
								Promise.all([
									createAccount(accountA.ownerId),
									createAccount(accountA.ownerId)
								])
							)
							.then(([accountB, accountC]) =>
								Promise.all([
									transferReportStatusCode(accountA.id, accountB.id, 5000),
									transferReportStatusCode(accountA.id, accountC.id, 4000)
								])
								.then(statusCodes => statusCodes.should.have.members([200, 400]))
							)
					});
			});

			it('should fail due to amount exceeds daily transfer limit', function () {
				return createAccount(null, randomName())
					.then(accountA => {
						return deposit(accountA.id, 20000)
							.then(() => createAccount(accountA.ownerId))
							.then(accountB => transfer(accountA.id, accountB.id, 11000, 400))
					});
			});

			it('should fail due to exceeding daily transfer limit', function () {
				return createAccount(null, randomName())
					.then(accountA => {
						return deposit(accountA.id, 20000)
							.then(() => createAccount(accountA.ownerId))
							.then(accountB =>
								transfer(accountA.id, accountB.id, 6000)
									.then(() => transfer(accountA.id, accountB.id, 5000, 400))
							)
					});
			});

			const modifyRecordAsYesterday = (accountId, toAccountId, amount) =>
				db.query("UPDATE records SET created_at = created_at - interval '24 hours' WHERE account_id=$1 and to_account_id=$2 and amount=$3", [accountId, toAccountId, amount]);

			it('should only count today transfer in daily transfer limit', function () {
				return createAccount(null, randomName())
					.then(accountA => {
						return deposit(accountA.id, 20000)
							.then(() => createAccount(accountA.ownerId))
							.then(accountB =>
								transfer(accountA.id, accountB.id, 6000)
									.then(() => modifyRecordAsYesterday(accountA.id, accountB.id, 6000))
									.then(() => transfer(accountA.id, accountB.id, 5000))
							)
					});
			});

			it('should charge 100 for cross owner transfer', function () {
				return Promise.all([
					createAccount(null, randomName()),
					createAccount(null, randomName())
				])
				.then(([accountA, accountB]) =>
					deposit(accountA.id, 30000)
						.then(() => transfer(accountA.id, accountB.id, 4000))
						.then(() => getBalance(accountA.id).should.eventually.equal(25900))
						.then(() => getBalance(accountB.id).should.eventually.equal(4000))
				);
			});

			it('should fail due to insufficient deposit for service charge', function () {
				return Promise.all([
					createAccount(null, randomName()),
					createAccount(null, randomName())
				])
				.then(([accountA, accountB]) =>
					deposit(accountA.id, 4000)
						.then(() => transfer(accountA.id, accountB.id, 4000, 400))
				);
			});

			it('should fail due to external API fail', function () {
				nock.cleanAll();
				nock(approvalBaseUrl)
					.get(approvalPath)
					.reply(200, {status: 'fail'});

				return Promise.all([
					createAccount(null, randomName()),
					createAccount(null, randomName())
				])
				.then(([accountA, accountB]) =>
					deposit(accountA.id, 4100)
						.then(() => transfer(accountA.id, accountB.id, 4000, 400))
				);
			});
		});
	});
});
