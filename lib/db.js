const Pool = require('pg').Pool;

const config = {
	user: 'postgres',
	password: 'tinklabs',
	host: 'db'
};

const db = new Pool(config);

module.exports = db;
