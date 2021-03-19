const mongoose = require('mongoose');
const LineInputStream = require('line-input-stream');
const fs = require('fs');
const path = require('path');

const reviews_photos = new mongoose.Schema({
  review_id: Number,
  url: String
});

const reviews_schema = new mongoose.Schema({
  _id: Number,
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

const products_schema = new mongoose.Schema({
  _id: Number,
  ratings: {type: Object, default: {}},
  recommended: {type: Object, default: {}},
  characteristics: {type: Object, default: {}}
});

// const characteristics_scheme = new mongoose.Schema({
//   key:
// });

const ratings_schema = new mongoose.Schema({
  1: Number,
  2: Number,
  3: Number,
  4: Number,
  5: Number
});

const Reviews = mongoose.model('Reviews', reviews_schema);
const Reviews_photos = mongoose.model('Reviews_photos', reviews_photos);
const Products = mongoose.model('Products', products_schema);


// open a connection
mongoose.connect('mongodb://localhost/reviews_ratings_test_dummydata', {useNewUrlParser: true, useUnifiedTopology: true, autoIndex: false});

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
              console.log('seeding done for embedding photos!')
          });
      }
    });
  };

  const importDataForProducts = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/productTest.csv')));
    stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Products.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      // var obj = {
      //   _id: Number(row[0]),
      //   ratings: {},
      //   recommended: {},
      //   characteristics: {}
      // };

      var obj = new Products({
        _id: Number(row[0])
        ratings: {type: Object, default: {}},
        recommended: {type: Object, default: {}},
        characteristics: {type: Object, default: {}}
      });

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
            bulk = Products.collection.initializeOrderedBulkOp();

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
              console.log('seeding done for products!')
          });
      }
    });

  };

  const importDataForCharacteristics = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/characteristicsTest.csv')));
    stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Products.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      // var obj = {
      //   _id: Number(row[0]),
      //   [row[2]]: 1
      // };
      // obj[row[2]] = 1;
      let key = row[2];
      // console.log(bulk.find( { _id: Number(row[1]) } ).upsert())
      // bulk.find( { _id: Number(row[1]) } ).upsert().update( { $set: { characteristics: obj} })


      bulk.find( { _id: Number(row[1]) } ).upsert().update( { $set: { ['characteristics.' + key]: {id: Number(row[0]), value: []}} });

      // bulk.find({ Products: { $elemMatch: { _id: Number(row[1]) } } }).updateOne({ $addToSet: { Products.$.characteristics: 1 } });


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
            bulk = Products.collection.initializeOrderedBulkOp();

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
              console.log('seeding done for embedding characs!')
          });
      }
    });
  };

  const importDataForCharacteristicsValue_Fit = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/characteristic_reviews.csv')));
    stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Products.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      // var obj = {
      //   _id: Number(row[0]),
      //   [row[2]]: 1
      // };
      // obj[row[2]] = 1;
      let value = Number(row[3]);
      // console.log(value)
      // console.log(bulk.find( { _id: Number(row[1]) } ).upsert())
      // bulk.find( { _id: Number(row[1]) } ).upsert().update( { $set: { characteristics: obj} })

      // testing these 2 command lines below:

      // 1)
      bulk.find( { ['characteristics."Fit".id']: Number(row[1]) } ).upsert().update( { $push: { ['characteristics."Fit".value']: value } });

      // 2)

      // bulk.find({ characteristics: { $elemMatch: { ['Fit.id']: Number(row[1]) } } }).updateOne({ $addToSet: { ['characteristics.$.Fit.value']: 1000 } });

      // sample:
      // bulk.find({ answers: { $elemMatch: { answer_id: Number(row[1]) } } }).updateOne({ $addToSet: { "answers.$.photos": photoObj } })


      // bulk.find({ answers: { $elemMatch: { answer_id: Number(row[1]) } } }).updateOne({ $addToSet: { "answers.$.photos": photoObj } })

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
            if (err) throw err;   // or do something
            // possibly do something with result
            batch++;
            console.log(`${batch * 1000} finished, continuing...`)
            bulk = Products.collection.initializeOrderedBulkOp();

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
              console.log('seeding done for embedding charac Fit values!')
          });
      }
    });
  };

  const importDataForCharacteristicsValue_Length = () => {
    const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/characteristic_reviewsTest.csv')));
    stream.setDelimiter("\n");
    // lower level method, needs connection
    var bulk = Products.collection.initializeOrderedBulkOp();
    var counter = 0;
    var batch = 0;

    stream.on("error",function(err) {
      console.log(err); // or otherwise deal with it
    });

    stream.on("line",function(line) {
      var row = line.split(",");     // split the lines on delimiter
      // var obj = {
      //   _id: Number(row[0]),
      //   [row[2]]: 1
      // };
      // obj[row[2]] = 1;
      let value = Number(row[3]);
      // console.log(value)
      // console.log(bulk.find( { _id: Number(row[1]) } ).upsert())
      // bulk.find( { _id: Number(row[1]) } ).upsert().update( { $set: { characteristics: obj} })

      // testing these 2 command lines below:

      // 1)
      bulk.find( { ['characteristics."Length".id']: Number(row[1]) } ).upsert().update( { $push: { ['characteristics."Length".value']: value } });

      // 2)

      // bulk.find({ characteristics: { $elemMatch: { ['Fit.id']: Number(row[1]) } } }).updateOne({ $addToSet: { ['characteristics.$.Fit.value']: 1000 } });

      // sample:
      // bulk.find({ answers: { $elemMatch: { answer_id: Number(row[1]) } } }).updateOne({ $addToSet: { "answers.$.photos": photoObj } })


      // bulk.find({ answers: { $elemMatch: { answer_id: Number(row[1]) } } }).updateOne({ $addToSet: { "answers.$.photos": photoObj } })

      counter++;

      if ( counter % 1000 === 0 ) {
        stream.pause(); //lets stop reading from file until we finish writing this batch to db

        bulk.execute(function(err,result) {
            if (err) throw err;   // or do something
            // possibly do something with result
            batch++;
            console.log(`${batch * 1000} finished, continuing...`)
            bulk = Products.collection.initializeOrderedBulkOp();

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
              console.log(`seeding done for embedding charac Length values!`)
          });
      }
    });
  };

  // seed collections
  // importDataForReviews();
  // importDataForReviewsPhotos();
  importDataForProducts();
  // importDataForCharacteristics();
  // importDataForCharacteristicsValue_Fit();
  // importDataForCharacteristicsValue_Length();
})
