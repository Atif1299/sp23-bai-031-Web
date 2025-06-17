const mongodb = require('mongoose')

mongos = mongodb
  .connect('mongodb://localhost:27017/product', {})
  .then(() => {
    console.log('MongoDB connected')
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
  })
