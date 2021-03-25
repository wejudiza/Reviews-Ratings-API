const mongoose = require('mongoose');

// connect to mongoDB
mongoose.connect(`mongodb://13.56.246.24:8088/reviews_ratings`, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', (err, conn) => {
  console.log('connected to mongoDB!');
});