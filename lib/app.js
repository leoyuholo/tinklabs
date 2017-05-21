const express = require('express');
const bodyParser = require('body-parser');

const api = require('./api');

const app = express();

app.use(bodyParser.json());

app.use(api);

app.use((err, req, res) => {
	console.log(`error raised with path ${req.path} with message ${err.message}`);

	res.status(500).send();
});

module.exports = app;
