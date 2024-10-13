const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  details: {
    type: String,
    required: false,
  },
  rating: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
