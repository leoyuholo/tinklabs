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

		describe('deactivate', function () {
			it('should deactivate an account', function () {
				return request(app)
					.put('/account')
					.send({owner: {id: 1}})
					.expect(200)
					.then(res => {
						const account = res.body.account;
						return request(app)
							.delete(`/account/${account.id}`)
							.expect(200)
							.then(() =>
								request(app)
									.get(`/account/${account.id}`)
									.expect(404)
							);
					});
			});
		});
	});
});
