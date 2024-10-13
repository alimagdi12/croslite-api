const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  birthDay: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  phoneNumber: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});

userSchema.methods.increaseQuantityInCart = async function(productId) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === productId.toString();
  });
  if (cartProductIndex >= 0) {
    this.cart.items[cartProductIndex].quantity++;
    try {
      return await this.save();
    } catch (error) {
      console.error('Error increasing quantity in cart:', error);
      throw error;
    }
  }
};

userSchema.methods.decreaseQuantityInCart = async function(productId) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === productId.toString();
  });
  if (cartProductIndex >= 0) {
    const currentQuantity = this.cart.items[cartProductIndex].quantity;
    if (currentQuantity > 1) {
      this.cart.items[cartProductIndex].quantity--;
    } else {
      // If quantity is already 1, remove the item from the cart
      this.cart.items.splice(cartProductIndex, 1);
    }
    try {
      return await this.save();
    } catch (error) {
      console.error('Error decreasing quantity in cart:', error);
      throw error;
    }
  }
};

userSchema.methods.addToCart = async function(product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity
    });
  }
  const updatedCart = {
    items: updatedCartItems
  };
  this.cart = updatedCart;
  try {
    return await this.save();
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

userSchema.methods.removeFromCart = async function(productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  try {
    return await this.save();
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

userSchema.methods.clearCart = async function() {
  this.cart = { items: [] };
  try {
    return await this.save();
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
  