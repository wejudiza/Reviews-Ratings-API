const mongoose = require('mongoose');
const LineInputStream = require('line-input-stream');
const fs = require('fs');
const path = require('path');
const model = require('./model.js');

const Reviews = model.Reviews;
const Reviews_photos = model.Reviews_photos;
const Characs = model.Characs;

// open a connection
mongoose.connect('mongodb://localhost/reviews_ratings', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


db.once('open', (err, conn) => {
  console.log('connected to mongoDB!');

  // function to seed reviews collection with data

  // for characs collections:
  const importRatingRecFromReviews = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/reviews.csv'), {start: 108}));
    // lower level method, needs connection
    var bulk = Characs.collection.initializeUnorderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter

      if (row[6] === "true" || row[6] === 1) {
        bulk.find( { product_id: Number(row[1]) }).upsert().update( { $inc: { recommended: 1 } });
      }

      bulk.find( { product_id: Number(row[1]) }).upsert().update( { $inc: { [`rating.${Number(row[2])}`]: 1 } });

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
          if (err) null;   // or do something
          // possibly do something with result
          batch++;
          console.log(`${batch * 1000} rating and recommended entries finished, continuing...`);
          bulk = Characs.collection.initializeUnorderedBulkOp();

          stream.resume(); //continue to read from file
        });
      }
    });

    stream.on("end",function() {
      if ( counter % 1000 != 0 ) {
          bulk.execute(function(err,result) {
            if (err) null;   // or something
            // maybe look at result
            console.log(`seeding done for ${counter} entries of rating and recommended!`);
          });
      }
    });
  };

  // seed collections
  importRatingRecFromReviews();
});

