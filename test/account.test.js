const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

const request = require('supertest');
const epxress = require('express');
const DatabaseCleaner = require('database-cleaner');
const app = require('../lib/app');

describe('app', function () {
	describe('account', function () {
		describe('create', function () {
			it('should create an account', function () {
				return request(app)
					.put('/account')
					.send({owner: {name: 'leo'}})
					.expect(200)
					.then((res) => {
						const account = res.body.account;
						should.exist(res.body.account);
						res.body.account.should.have.property('ownerId').that.is.a('number');
						res.body.account.should.have.property('id').that.is.a('number');
						res.body.account.should.have.property('balance').that.is.a('number');
					});
			});
		});
	});
});
