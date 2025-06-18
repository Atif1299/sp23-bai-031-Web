const express = require('express')
const router = express.Router()
const Product = require('../models/product')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user')

// Home page
router.get('/', async (req, res) => {
  const products = await Product.find({ status: 'Active' }).sort({ createdAt: -1 }).limit(3)
  res.render('home', {
    title: 'People Tree EU',
    stylesheets: ['/css/home.css'],
    scripts: ['/js/home.js'],
    products
  })
})

// About page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us - People Tree EU',
    stylesheets: ['/css/home.css', '/css/about.css'],
    scripts: ['/js/home.js'],
  })
})

// FAQ page
router.get('/faq', (req, res) => {
  res.render('faq', {
    title: 'FAQ - People Tree EU',
    stylesheets: ['/css/home.css', '/css/faq.css'],
    scripts: ['/js/home.js', '/js/faq.js'],
  })
})

// CV page
router.get('/cv', (req, res) => {
  res.render('cv')
})

// Checkout page
router.get('/checkout', async (req, res) => {
  const token = req.cookies && req.cookies.token
  if (!token) return res.redirect('/user/login')
  let user = null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    user = await userModel.findOne({ email: decoded.email || decoded.id }).populate('shoppingCart.product')
    if (!user) return res.redirect('/user/login')
  } catch (err) {
    res.clearCookie('token')
    return res.redirect('/user/login')
  }
  const cart = user.shoppingCart || []
  res.render('checkout', { cart , stylesheets: ['/css/checkout.css'], scripts: ['/js/checkout.js'] })
})

// Terms page
router.get('/terms', (req, res) => {
  res.render('terms' , { stylesheets: ['/css/terms.css'] })
})

// Shop page
router.get('/shop', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 })
  res.render('shop', {
    title: 'Shop - People Tree EU',
    stylesheets: ['/css/shop.css'],
    scripts: ['/js/home.js'],
    layout: 'layout',
    products
  })
})

// Public Cart page
router.get('/cart', async (req, res) => {
  const token = req.cookies && req.cookies.token
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET)
      // If token is valid, redirect to user's cart
      return res.redirect('/user/account/cart')
    } catch (err) {
      // Invalid token, clear cookie and show public cart
      res.clearCookie('token')
    }
  }
  res.render('public_cart', {
    title: 'Shopping Cart',
    stylesheets: ['/css/user_account.css']
  })
})

module.exports = router
