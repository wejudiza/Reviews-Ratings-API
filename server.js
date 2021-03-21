const mongoose = require('mongoose');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyparser = require('body-parser');
const path = require('path');
const PORT = 3003;
const server = express();

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

// connect to mongoDB
mongoose.connect('mongodb://localhost/reviews_ratings', {useNewUrlParser: true, useUnifiedTopology: true});

const reviews_schema = new mongoose.Schema({
  _id: Number,
  product_id: {type: Number, index: true},
  rating: Number,
  date: String,
  summary: String,
  body: String,
  recommend: Boolean,
  reported: Boolean,
  reviewer_name: String,
  reviewer_email: String,
  response: String,
  helpfulness: Number,
});

server.get('/reviews', (req, res) => {
  // console.log(req.query.product_id)
  const Reviews = mongoose.model('Reviews', reviews_schema);

  const query = {
    product_id: Number(req.query.product_id)
  };

  Reviews.find(query, (err, data) => {
    if (err) res.status(400).send(err);
    res.status(200).send(data);
  })

})
