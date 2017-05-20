const express = require('express');
const bodyParser = require('body-parser');

const api = require('./api');

const app = express();

app.use(bodyParser.json());

app.use(api);

module.exports = app;
