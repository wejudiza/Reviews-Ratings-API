// const DataFrame = require('dataframe-js').DataFrame;
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const characteristics = [];
const reviews = [];

fs.createReadStream(path.join(__dirname, './data/characteristics.csv'))
  .pipe(csv({}))
  .on('data', (data) => {
    characteristics.push(data);
  })
  .on('end', () => {
    console.log('characteristics done!');

    fs.createReadStream(path.join(__dirname, './data/characteristic_reviews.csv'))
      .pipe(csv({}))
      .on('data', (data) => {
        reviews.push(data);
      })
      .on('end', () => {
         console.log('reviews done!');

         characteristics.forEach((obj) => {
           let id = obj.id;
           reviews.forEach((obj2) => {
             if (obj2.characteristic_id === id) {
               obj['value'] = obj2.value;
             }
           })
         })

         console.log(characteristics)

      })


    // const csvWriter = createCsvWriter({
    //     path: './data/test.csv',
    //     header: [
    //         {id: 'id', title: 'ID'},
    //         {id: 'product_id', title: 'PRODUCT_ID'},
    //         {id: 'name', title: 'NAME'}
    //     ]
    // });

    // csvWriter.writeRecords(result)       // returns a promise
    //     .then(() => {
    //         console.log('...Done');
    //     });
  })


