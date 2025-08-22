const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const countryVisitSchema = new Schema({
  country: {
    type: String,
    required: true,
    unique: true
  },
  visits: {
    type: Number,
    default: 0
  },
  lastVisit: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("CountryVisit", countryVisitSchema);