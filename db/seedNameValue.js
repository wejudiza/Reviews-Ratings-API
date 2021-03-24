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

  // for characs collections:

  const importDataForCharac_reviews = () => {

    const seedCharac_reviews = () => {
      const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/characteristic_reviews.csv'), {start: 37}));
      // stream.setDelimiter("\n");
      // lower level method, needs connection
      var bulk = Characs.collection.initializeUnorderedBulkOp();
      var counter = 0;
      var batch = 0;

      stream.on("error",function(err) {
        console.log(err); // or otherwise deal with it
      });

      stream.on("line",function(line) {
        var row = line.split(",");     // split the lines on delimiter

        bulk.find( { _id: Number(row[1]) }).upsert().updateOne( { $inc: { totalValue: Number(row[3]) } });
        bulk.find( { _id: Number(row[1]) }).upsert().updateOne( { $inc: { totalReview: 1 } });

        // bulk.insert(obj);  // Bulk is okay if you don't need schema
        //                     // defaults. Or can just set them.

        counter++;

        if ( counter % 1000 === 0 ) {
          stream.pause(); //lets stop reading from file until we finish writing this batch to db

          bulk.execute(function(err,result) {
              if (err) null;   // or do something
              // possibly do something with result
              batch++;
              console.log(`${batch * 1000} characteristic_reviews entries finished, continuing...`)
              bulk = Characs.collection.initializeUnorderedBulkOp();

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
                console.log(`seeding done for ${counter} characteristic_reviews!`)
            });
        }
      });
    };

    db.db.listCollections().toArray((err, names) => {
      let exist = false;

      names.forEach((obj) => {
        if (obj.name === 'charac_reviews') {
          exist = true;
        }
      });

      if (exist) {
        db.dropCollection('charac_reviews', (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('OLD COLLECTION DROPPED!');
            seedCharac_reviews();
          }
        });
      } else {
        seedCharac_reviews();
      }
    });

  };

  // seed collections
  importDataForCharac_reviews();
});

