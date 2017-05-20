const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

const request = require('supertest');
const epxress = require('express');

const app = require('../lib/app');

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

		const createAccount = () =>
			request(app)
				.put('/account')
				.send({owner: {id: 1}})
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

		describe('deposit', function () {
			it('should deposit money into account', function () {
				return createAccount()
					.then(account =>
						deposit(account.id, 1000)
							.then(() =>
								request(app)
									.get(`/account/${account.id}`)
									.then(res => {
										res.body.account.balance.should.be.equal(1000);
									})
							)
					);
			});

			it('should deposit more money into account', function () {
				return createAccount()
					.then(account =>
						deposit(account.id, 1000)
							.then(() => deposit(account.id, 500))
							.then(() =>
								request(app)
									.get(`/account/${account.id}`)
									.then(res => {
										res.body.account.balance.should.be.equal(1500);
									})
							)
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
							.then(() =>
								request(app)
									.get(`/account/${account.id}`)
									.then(res => {
										res.body.account.balance.should.be.equal(500);
									})
							)
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
							.then(() =>
								request(app)
									.get(`/account/${account.id}`)
									.then(res => {
										res.body.account.balance.should.be.equal(1000);
									})
							)
					);
			});
		});
	});
});
