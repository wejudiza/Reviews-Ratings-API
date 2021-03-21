const mongoose = require('mongoose');
const LineInputStream = require('line-input-stream');
const fs = require('fs');
const path = require('path');

const reviews_photos = new mongoose.Schema({
  _id: Number,
  url: String
});

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

const products_schema = new mongoose.Schema({
  _id: Number,
  ratings: {type: Object, default: {}},
  recommended: {type: Object, default: {}},
  characteristics: {type: Object, default: {}}
});

const ratings_schema = new mongoose.Schema({
  1: Number,
  2: Number,
  3: Number,
  4: Number,
  5: Number
});

const characs_schema = new mongoose.Schema({
  _id: Number,
  product_id: Number,
  name: String
});

const charac_reviews_schema = new mongoose.Schema({
  _id: Number,
  characteristic_id: Number,
  review_id: Number,
  value: Number
});

const Reviews = mongoose.model('Reviews', reviews_schema);
const Reviews_photos = mongoose.model('Reviews_photos', reviews_photos);
const Products = mongoose.model('Products', products_schema);
const Characs = mongoose.model('Characs', characs_schema);
const Charac_reviews = mongoose.model('Charac_reviews', charac_reviews_schema);


// open a connection
mongoose.connect('mongodb://localhost/reviews_ratings', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


db.once('open', (err, conn) => {
  console.log('connected to mongoDB!');

  // function to seed reviews collection with data

  const importDataForReviews = () => {

    const seedReviewsCollection = () => {
      const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/reviews.csv'), {start: 108}));
      // lower level method, needs connection
      var bulk = Reviews.collection.initializeOrderedBulkOp();
      var counter = 0;
      var batch = 0;

      stream.on("error",function(err) {
        console.log(err); // or otherwise deal with it
      });

      stream.on("line",function(line) {
        var row = line.split(",");     // split the lines on delimiter
        // console.log('line:', line)
        // console.log('type', typeof row[6])
        var reviewObj = new Reviews({
          _id: row[0],
          product_id: row[1],
          rating: row[2],
          date: JSON.parse(row[3]),
          summary: JSON.parse(row[4]),
          body: JSON.parse(row[5]),
          recommend: (row[6] === "true" || row[6] === 1) ? true : false,
          reported: (row[7] === "true" || row[7] === 1) ? true : false,
          reviewer_name: JSON.parse(row[8]),
          reviewer_email: JSON.parse(row[9]),
          response: (!row[10]) ? row[10] : JSON.parse(row[10]),
          helpfulness: row[11]
        });

        bulk.insert(reviewObj);  // Bulk is okay if you don't need schema
                            // defaults. Or can just set them.

        counter++;

        if ( counter % 1000 === 0 ) {
          stream.pause(); //lets stop reading from file until we finish writing this batch to db

          bulk.execute(function(err,result) {
              if (err) throw err;   // or do something
              // possibly do something with result
              batch++;
              console.log(`${batch * 1000} review entries finished, continuing...`)
              bulk = Reviews.collection.initializeOrderedBulkOp();

              stream.resume(); //continue to read from file
          });
        }
      });

      stream.on("end",function() {
        if ( counter % 1000 != 0 ) {
            bulk.execute(function(err,result) {
                if (err) throw err;   // or something
                // maybe look at result
                console.log(`seeding done for ${counter} entries of reviews!`)
            });
        }
      });
    };

    db.db.listCollections().toArray((err, names) => {
      let exist = false;

      names.forEach((obj) => {
        if (obj.name === 'reviews') {
          exist = true;
        }
      });

      if (exist) {
        db.dropCollection('reviews', (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('OLD COLLECTION DROPPED!');
            seedReviewsCollection();
          }
        });
      } else {
        seedReviewsCollection();
      }
    });
  };

  const importDataForReviewsPhotos = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/reviews_photos.csv'), {start: 17}));

    // lower level method, needs connection
    var bulk = Reviews.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      var obj = new Reviews_photos({
        _id: row[0],
        url: JSON.parse(row[2])
      });

      bulk.find( { _id: Number(row[1]) } ).upsert().update( { $push: { photos: obj } })

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
          if (err) throw err;   // or do something
          // possibly do something with result
          batch++;
          console.log(`${batch * 1000} review photo entries finished, continuing...`);
          bulk = Reviews.collection.initializeOrderedBulkOp();

          stream.resume(); //continue to read from file
        });
      }
    });

    stream.on("end",function() {
      console.log('less than 1000 review photo entries to go...')
      if ( counter % 1000 != 0 ) {
          bulk.execute(function(err,result) {
            if (err) throw err;   // or something
            // maybe look at result
            console.log(`seeding done for embedding ${counter} photos entries!`);
            // chain seeding function for photos to embed into reviews when done
            importDataForReviewsPhotos();
          });
      }
    });
  };

  const importDataForCharacCSV = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/characteristics.csv'), {start: 19}));
    // stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Characs.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      var obj = new Characs({
        _id: Number(row[0]),
        product_id: Number(row[1]),
        name: JSON.parse(row[2])
      });

      bulk.insert(obj);  // Bulk is okay if you don't need schema
                          // defaults. Or can just set them.

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
            if (err) null;   // or do something
            // possibly do something with result
            batch++;
            console.log(`${batch * 1000} characteristics entries finished, continuing...`)
            bulk = Characs.collection.initializeOrderedBulkOp();

            stream.resume(); //continue to read from file
        });
      }
    });

    stream.on("end",function() {
      console.log('less than 1000 characteristics entries to go...')
      if ( counter % 1000 != 0 ) {
          bulk.execute(function(err,result) {
              if (err) null;   // or something
              // maybe look at result
              console.log('seeding done for characteristics!')
          });
      }
    });

  };

  const importDataForCharac_reviews = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/characteristic_reviews.csv'), {start: 37}));
    // stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Charac_reviews.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      var obj = new Charac_reviews({
        _id: Number(row[0]),
        characteristic_id: Number(row[1]),
        review_id: Number(row[2]),
        value: Number(row[3])
      });

      bulk.insert(obj);  // Bulk is okay if you don't need schema
                          // defaults. Or can just set them.

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
            if (err) null;   // or do something
            // possibly do something with result
            batch++;
            console.log(`${batch * 1000} characteristic_reviews entries finished, continuing...`)
            bulk = Charac_reviews.collection.initializeOrderedBulkOp();

            stream.resume(); //continue to read from file
        });
      }
    });

    stream.on("end",function() {
      console.log('less than 1000 characteristic_reviews entries to go...')
      if ( counter % 1000 != 0 ) {
          bulk.execute(function(err,result) {
              if (err) null;   // or something
              // maybe look at result
              console.log('seeding done for characteristic_reviews!')
          });
      }
    });

  };




  // seed collections

  // working functions:
  importDataForReviews();
  // importDataForReviewsPhotos();
  // importDataForCharacCSV();
  // importDataForCharac_reviews();
});

