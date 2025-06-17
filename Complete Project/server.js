const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('./config/db')
const expressLayouts = require('express-ejs-layouts')
const cookieParser = require('cookie-parser')

// Import routes
const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const contactRoutes = require('./routes/contactRoutes')
const pageRoutes = require('./routes/pageRoutes')

dotenv.config()

const app = express()

// View engine setup
app.set('view engine', 'ejs')
app.set('layout', 'layout')
app.use(expressLayouts)

// Middleware
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Routes
app.use('/', pageRoutes)
app.use('/user', userRoutes)
app.use('/admin', adminRoutes)
app.use('/contact', contactRoutes)

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
