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

const characs_schema = new mongoose.Schema({
  _id: Number,
  product_id: {type: Number, index: true},
  name: String
});

const charac_reviews_schema = new mongoose.Schema({
  _id: Number,
  characteristic_id: {type: Number, index: true},
  review_id: Number,
  value: Number
});

server.get('/reviews', (req, res) => {
  // console.log(req.query.product_id)
  const Reviews = mongoose.model('Reviews', reviews_schema);

  const query = {
    product_id: Number(req.query.product_id)
  };

  let sortMethod = (req.query.sort === 'newest') ? '-date': '-helpfulness';

  Reviews.find(query).select('-_id review_id rating summary recommend response body date reviewer_name helpfulness photos').sort(sortMethod).exec((err, data) => {
    if (err) {
      res.status(400).send(err);
    } else {
      let page = req.query.page || 1;
      let count = req.query.count || 5;
      let formatted = {
        product: req.query.product_id,
        page: page,
        count: count,
        results: data.slice(0, Math.min(count, data.length))
      };
      res.status(200).send(formatted);
    }
  })

});

server.get('/reviews/meta', (req, res) => {
  const Characs = mongoose.model('Characs', characs_schema);
  const Charac_reviews = mongoose.model('Charac_reviews', charac_reviews_schema);
  const Reviews = mongoose.model('Reviews', reviews_schema);

  const queryProduct_id = {
    product_id: Number(req.query.product_id)
  };
  const queryCharac_id = {
    characteristic_id: Number(req.query.characteristic_id)
  };

  // find query to find all keys in characteristics
  Characs.find(queryProduct_id).select('-product_id').exec((err, data) => {
    if (err) {
      res.status(400).send(err);
    } else {
      let result = {
        product_id: req.query.product_id,
        ratings: {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        recommended: {
          0: 0
        },
        characteristics: {}
      };

      // find and calculate values for each charac, rating and recommend
      data.forEach((obj) => {
        let name = obj.name;
        let id = obj._id;
        let arrOfVal = [];
        let arrOfReview_id = [];
        const queryCharac_id = {
          characteristic_id: Number(id)
        };

        // get value for avrg value for charac, and array of review_ids for later use
        Charac_reviews.find(queryCharac_id, (err, data) => {
          if (err) {
            res.status(400).send(err);
          } else {
            data.forEach((obj) => {
              arrOfVal.push(obj.value);
              arrOfReview_id.push(obj.review_id);
            });
          }

          // use review_ids list to get rating and recommend values
          arrOfReview_id.forEach((id) => {
            const queryForEachId = {
              product_id: id
            };

            Reviews.find(queryForEachId).select('-_id rating recommend').exec((err, data) => {
              if (err) {
                res.status(400).send(err);
              } else {
                data.forEach((obj) => {
                  if (obj.recommend) {
                    result.recommended[0]++;
                  }
                  result.ratings[`${obj.rating}`]++;

                })
              }
            })
          })

          // calculation for avrg and set it to coresponding charac value in result obj
          let sum = arrOfVal.reduce((prev, current) => {
            return current += prev;
          });
          let avrg = sum/arrOfVal.length;
          result.characteristics[`${name}`] = {
            id: id,
            value: avrg
          }
        });

      });
      // have to manually set time to wait for queries hell to resolve
      setTimeout(()=>{
        res.status(200).send(result);
      }, 20)
    }
  });

});

