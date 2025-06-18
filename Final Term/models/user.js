const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  shoppingCart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 }
    }
  ],
  purchaseHistory: [
    {
      items: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          quantity: Number
        }
      ],
      address: String,
      amount: Number,
      paymentMethod: String,
      date: { type: Date, default: Date.now }
    }
  ],
})

const user = mongoose.model('user', userSchema)
module.exports = user
