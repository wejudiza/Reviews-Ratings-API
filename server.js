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
  review_id: {type: Number, index: {unique: true}},
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

  let sortMethod = (req.query.sort === 'newest') ? '-date': '-helpfulness';

  Reviews.find(query).select('-_id review_id rating summary recommend response body date reviewer_name helpfulness photos').sort(sortMethod).exec( (err, data) => {
    if (err) {
      res.status(400).send(err);
    } else {
      let page = req.query.page || 1;
      let count = req.query.count || 5;
      let formatted = {
        product: data[0].product_id,
        page: page,
        count: count,
        results: data.slice(0, Math.min(count, data.length))
      };
      res.status(200).send(formatted);
    }
  })

})
