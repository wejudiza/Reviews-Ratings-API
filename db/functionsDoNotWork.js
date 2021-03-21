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
      _id: Number(row[0]),
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

const importDataForValueInMeta = () => {
  const stream = LineInputStream(fs.createReadStream(path.join(__dirname, './data/characteristic_reviews.csv'), {start: 37}));
  // lower level method, needs connection
  var bulk = Meta.collection.initializeOrderedBulkOp();
  var counter = 0;
  var batch = 0;

  stream.on("error",function(err) {
    console.log(err); // or otherwise deal with it
  });

  stream.on("line",function(line) {
    var row = line.split(",");     // split the lines on delimiter

    var obj = {
      review_id: Number(row[2]),
      value: Number(row[3])
    };

    bulk.find( { _id: Number(row[1]) } ).updateOne({ $push: {reviewId_value: obj} });

    counter++;

    if ( counter % 1000 === 0 ) {
      stream.pause(); //lets stop reading from file until we finish writing this batch to db

      bulk.execute(function(err,result) {
          if (err) throw err;   // or do something
          // possibly do something with result
          batch++;
          console.log(`${batch * 1000} review_id and value finished, continuing...`)
          bulk = Meta.collection.initializeOrderedBulkOp();

          stream.resume(); //continue to read from file
      });
    }
  });

  stream.on("end",function() {
    console.log('less than 1000 review_id and value entries to go...')
    if ( counter % 1000 != 0 ) {
        bulk.execute(function(err,result) {
            if (err) throw err;   // or something
            // maybe look at result
            console.log('seeding done for review_id and value!')
        });
    }
  });
};