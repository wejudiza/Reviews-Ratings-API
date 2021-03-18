const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyparser = require('body-parser');
const path = require('path');
const PORT = 3003;
const server = express();
const db = require('./db/index.js');

// apply middleware
server.use(morgan('dev'));
server.use(cors());
server.use(bodyparser.json());

// initial test for server
server.get('/api', () => {console.log('received')});

// start server, by running npm start
server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
})