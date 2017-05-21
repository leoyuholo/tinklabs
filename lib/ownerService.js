const _ = require('lodash');

const db = require('./db');

const ownerService = {};

ownerService.create = name =>
	db.query('INSERT INTO owners (name) VALUES ($1) RETURNING id, name', [name])
		.then(result => _.pick(result.rows[0], ['id', 'name']));

module.exports = ownerService;
