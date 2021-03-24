require('newrelic');
const mongoose = require('mongoose');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyparser = require('body-parser');
const path = require('path');
const PORT = 3003;
const server = express();
const model = require('./db/model.js');
const address = require('./db/ip.js');

// require dateformat
const dateFormat = require('dateformat');

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
mongoose.connect(`mongodb://${address}/reviews_ratings`, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', (err, conn) => {
  console.log(`connected to mongoDB@${address}!`);
});

const Reviews = model.Reviews;
const Reviews_photos = model.Reviews_photos;
const Characs = model.Characs;

server.get('/reviews', (req, res) => {
  // console.log(req.query.product_id)
  const query = {
    product_id: Number(req.query.product_id)
  };

  let sortMethod = (req.query.sort === 'newest') ? '-date': '-helpfulness';

  Reviews.find(query).select('-_id review_id rating summary recommend response body date reviewer_name helpfulness photos').where('reported').equals(false).sort(sortMethod).exec((err, data) => {
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
  });

});

server.get('/reviews/meta', (req, res) => {

  const queryProduct_id = {
    product_id: Number(req.query.product_id)
  };

  // find query to find all keys in characteristics
  Characs.find(queryProduct_id).select('-product_id').exec((err, data) => {
    if (err) {
      res.status(400).send(err);
    } else {
      // console.log(data)
      let result = {
        product_id: req.query.product_id,
        rating: data[0].rating,
        recommended: {
          0: data[0].recommended
        },
        characteristics: {}
      };
      data.forEach((obj) => {
        result.characteristics[obj.name] = {
          id: obj._id,
          value: obj.totalValue/obj.totalReview
        }
      });
      res.status(200).send(result);
    }
  });
});

server.post('/reviews', (req, res) => {
  Reviews.count((err, count) => {
    const query = new Reviews({
      review_id: count++,
      product_id: req.body.product_id,
      rating: req.body.rating,
      data: dateFormat(new Date(), "yyyy-mm-dd"),
      summary: req.body.summary,
      body: req.body.body,
      recommend: req.body.recommend || false,
      reported: false,
      reviewer_name: req.body.name,
      reviewer_email: req.body.email,
      helpfulness: 0,
      photos: (Array.isArray(req.body.photos)) ? req.body.photos.map((str) => {
        return {
          url: str
        }
      }) : []
    });

    Reviews.create(query, (err) => {
      if (err) {
        res.status(400).send(err);
      } else {
        res.status(201).send('created!')
      }
    });
  })
});

server.put('/reviews/:review_id/helpful', (req, res) => {
  const query = {
    review_id: req.params.review_id
  };

  Reviews.find(query).select('-_id helpfulness').exec((err, data) => {
    if (err) {
      res.status(400).send(err);
    } else {
      let currentVal = data[0].helpfulness;
      console.log(currentVal)
      Reviews.updateOne(query, {helpfulness: currentVal+1}, (err) => {
        if (err) {
          res.status(400).send(err);
        } else {
          res.status(204).end();
        }
      })
    }
  });
});

server.put('/reviews/:review_id/report', (req, res) => {
  const query = {
    review_id: req.params.review_id
  };

  Reviews.updateOne(query, {reported: true}, (err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(204).end();
    }
  });
});

