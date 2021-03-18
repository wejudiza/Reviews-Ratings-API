const mongoose = require('mongoose');
const LineInputStream = require('line-input-stream');
const fs = require('fs');
const path = require('path');

const reviews_photos = new mongoose.Schema({
  review_id: Number,
  url: String
});

const reviews_schema = new mongoose.Schema({
  product_id: Number,
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

const Reviews = mongoose.model('Reviews', reviews_schema);
const Reviews_photos = mongoose.model('Reviews_photos', reviews_photos);
// const Characteristics = mongoose.model('Characteristics', {});

// Reviews.createCollection();
// Reviews_photos.createCollection();
// Characteristics.createCollection();

// open a connection
mongoose.connect('mongodb://localhost/reviews_ratings', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


db.once('open', (err, conn) => {
  console.log('connected to mongoDB!');
  // function to seed reviews collection with data

  const importDataForReviews = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/reviews.csv')));
    stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Reviews.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      var obj = {
        _id: Number(row[0]),
        product_id: Number(row[1]),
        rating: Number(row[2]),
        date: String(row[3]),
        summary: String(row[4]),
        body: String(row[5]),
        recommend: Boolean(row[6]),
        reported: Boolean(row[7]),
        reviewer_name: String(row[8]),
        reviewer_email: String(row[9]),
        response: String(row[10]),
        helpfulness: Number(row[11])
      };

      bulk.insert(obj);  // Bulk is okay if you don't need schema
                          // defaults. Or can just set them.

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
            if (err) throw err;   // or do something
            // possibly do something with result
            batch++;
            console.log(`${batch * 1000} finished, continuing...`)
            bulk = Reviews.collection.initializeOrderedBulkOp();

            stream.resume(); //continue to read from file
        });
      }
    });

    stream.on("end",function() {
      console.log('less than 1000 entries to go...')
      if ( counter % 1000 != 0 ) {
          bulk.execute(function(err,result) {
              if (err) throw err;   // or something
              // maybe look at result
              console.log('seeding done for reviews!')
          });
      }
    });

  };

  const importDataForReviewsPhotos = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/reviews_photos.csv')));
    stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Reviews.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      var obj = {
        _id: Number(row[0]),
        review_id: Number(row[1]),
        url: String(row[2])
      };

      bulk.find( { _id: Number(row[1]) } ).upsert().update( { $push: { photos: obj } })
      // bulk.find({ answers: { $elemMatch: { answer_id: Number(row[1]) } } }).updateOne({ $addToSet: { "answers.$.photos": photoObj } })
      // bulk.insert(obj);  // Bulk is okay if you don't need schema
                          // defaults. Or can just set them.

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
            if (err) throw err;   // or do something
            // possibly do something with result
            batch++;
            console.log(`${batch * 1000} finished, continuing...`)
            bulk = Reviews.collection.initializeOrderedBulkOp();

            stream.resume(); //continue to read from file
        });
      }
    });

    stream.on("end",function() {
      console.log('less than 1000 entries to go...')
      if ( counter % 1000 != 0 ) {
          bulk.execute(function(err,result) {
              if (err) throw err;   // or something
              // maybe look at result
              console.log('seeding done for reviews!')
          });
      }
    });
  };

  // seed reviews collection
  // importDataForReviews();
  importDataForReviewsPhotos();
})
