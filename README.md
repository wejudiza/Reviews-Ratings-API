# Reviews-Ratings-API
back-end express server and mongoDB database for reviews &amp; ratings for Project-Atelier

# Listening on port 3003

# Apis
1) GET /reviews: get all reviews accroding to product_id
2) GET /reviews/meta get meta reviews data according to product_id
3) POST /reviews: post a new review for a product
4) PUT /reviews/:review_id/helpful: rate one review as helpful
5) PUT /reviews/:review_id/report: report one review

# Setup Instructions
1) npm install
2) npm run seedReviews
3) npm run seedCharacs
4) npm run seedNameValue
5) npm run seedRatingRec

# Development Model
1) npm run start

# Production Model
1) npm run build