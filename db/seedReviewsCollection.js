const mongoose = require('mongoose');
const LineInputStream = require('line-input-stream');
const fs = require('fs');
const path = require('path');
const model = require('./model.js');
const address = require('./ip.js');

const Reviews = model.Reviews;
const Reviews_photos = model.Reviews_photos;
const Characs = model.Characs;

// open a connection
mongoose.connect(`mongodb://${address}/reviews_ratings`, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


db.once('open', (err, conn) => {
  console.log(`connected to mongoDB@${address}!`);

  // function to seed reviews collection with data
  // for reviews collection:
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
          review_id: row[0],
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
            console.log(`${batch * 1000} review entries finished, continuing...`);
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
              console.log(`seeding done for ${counter} entries of reviews!`);
              // chain seeding function for photos to embed into reviews when done
              importDataForReviewsPhotos();
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
        id: row[0],
        url: JSON.parse(row[2])
      });

      bulk.find( { review_id: Number(row[1]) } ).upsert().update( { $push: { photos: obj } })

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
        });
      }
    });
  };


  // seed collections
  importDataForReviews();
});

