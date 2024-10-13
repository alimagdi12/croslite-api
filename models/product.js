const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  // category: {
  //   type: String,
  //   required: true,
  // },
  title: {
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
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

productSchema.methods.addImageUrl = async function (imageUrl) {
  this.imageUrl.images.push(imageUrl);
  // await this.save(); // Save the document after all images are added
  // return this;
};

module.exports = mongoose.model("Product", productSchema);
