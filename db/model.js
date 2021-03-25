const mongoose = require('mongoose');

const reviews_photos = new mongoose.Schema({
  id: {type: Number, index: true},
  url: String
}, {_id: false});

const reviews_schema = new mongoose.Schema({
  review_id: {type: Number, index: {unique: true}},
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
  photos: [reviews_photos]
});

const characs_schema = new mongoose.Schema({
  _id: Number,
  product_id: {type: Number, index: true},
  name: String,
  totalValue: Number,
  totalReview: Number,
  recommended: Number,
  rating: Object
});

const Reviews = mongoose.model('Reviews', reviews_schema);
const Reviews_photos = mongoose.model('Reviews_photos', reviews_photos);
const Characs = mongoose.model('Characs', characs_schema);

module.exports = {
  Reviews: Reviews,
  Reviews_photos: Reviews_photos,
  Characs:Characs
};