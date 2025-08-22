const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const governorateVisitSchema = new Schema({
  governorate: {
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

module.exports = mongoose.model("GovernorateVisit", governorateVisitSchema);