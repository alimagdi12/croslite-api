const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  arabicTitle: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  imageUrl: {
    images: [
      {
        type: String,
        required: true,
      },
    ],
  },
  sizeFrom: {
    type: Number,
    required: true,
  },
  sizeTo: {
    type: Number,
    required: true,
  },
  size: {
    range: [
      {
        type: String,
        required: false,
      },
    ],
  },
  sizeInLetters: {
    type: String,
    required: false,
  },
  sizeInCm: {
    type: Number,
    required: false,
  },
  firstColor: {
    type: String,
    required: true,
  },
  secondColor: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
    max: 5
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, {
  timestamps: true // Add createdAt and updatedAt fields
});

// Add a method to check if user owns the product
productSchema.methods.isOwner = function(userId) {
  return this.userId.toString() === userId.toString();
};

// Add image URL method
productSchema.methods.addImageUrl = async function (imageUrl) {
  this.imageUrl.images.push(imageUrl);
  // await this.save(); // Save the document after all images are added
  // return this;
};

module.exports = mongoose.model("Product", productSchema);