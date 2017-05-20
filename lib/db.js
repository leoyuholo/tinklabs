const Pool = require('pg').Pool;
const bluebird = require('bluebird');

const config = {
	user: 'postgres',
	password: 'tinklabs',
	host: 'db'
};

const db = new Pool(config);

db.query = bluebird.promisify(db.query);

module.exports = db;
