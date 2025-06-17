const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user')
const Product = require('../models/product')
const nodemailer = require('nodemailer')
const Message = require('../models/message')

// User Login page
router.get('/login', (req, res) => {
  res.render('user_login')
})

// User Login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.render('user_login', { message: 'Missing email or password' })
  }

  let user = await userModel.findOne({ email })

  if (!user) {
    return res.render('user_login', { message: 'User not found' })
  }
  bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      console.error(err)
      return res.render('user_login', { message: 'Internal Server Error' })
    }

    if (result) {
      // Clear any existing admin session
      res.clearCookie('adminToken', { path: '/' })
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      })

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      })

      console.log('User logged in:', user.email)
      return res.redirect('/user/account')
    } else {
      return res.render('user_login', { message: 'Invalid credentials' })
    }
  })
})

// User Signup page
router.get('/signup', (req, res) => {
  res.render('user_signup')
})

// User Signup handler
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.render('user_signup', {
        title: 'Sign Up',
        message: 'Missing required fields',
      })
    }
    // Password strength validation
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      return res.render('user_signup', {
        message: 'Password must be at least 8 characters and include both letters and numbers.'
      })
    }

    const existingUser = await userModel.findOne({ email })
    if (existingUser) {
      return res.render('user_signup', {
        message: 'Email is already registered',
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const createdUser = await userModel.create({
      name,
      email,
      password: hash,
    })
    const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })
    res.redirect('/user/login')
  } catch (error) {
    console.error(error)
    let message = 'Internal Server Error'
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      message = 'Email is already registered'
    }
    return res.render('signup', { message })
  }
})

function requireUserLogin(req, res, next) {
  const token = req.cookies.token
  if (!token) return res.redirect('/user/login')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userEmail = decoded.email || decoded.id // fallback for old tokens
    next()
  } catch (err) {
    res.clearCookie('token')
    return res.redirect('/user/login')
  }
}

// User Account Dashboard
router.get('/account', requireUserLogin, async (req, res) => {
  const user = await userModel.findOne({ email: req.userEmail })
  res.render('user_account', { user, stylesheets: ['/css/user_account.css'] })
})

// Shopping Cart View
router.get('/account/cart', requireUserLogin, async (req, res) => {
  const user = await userModel.findOne({ email: req.userEmail }).populate('shoppingCart.product')
  res.render('user_cart', { cart: user.shoppingCart, stylesheets: ['/css/user_account.css'] })
})

// Purchase History View (real)
router.get('/account/history', requireUserLogin, async (req, res) => {
  const user = await userModel.findOne({ email: req.userEmail })
    .populate({
      path: 'purchaseHistory.items.product',
      model: 'Product'
    })
  res.render('user_history', { user, stylesheets: ['/css/user_account.css'] })
})

// Add to Cart (with quantity support)
router.post('/cart/add/:productId', requireUserLogin, async (req, res) => {
  const user = await userModel.findOne({ email: req.userEmail })
  const productId = req.params.productId
  const quantity = parseInt(req.body.quantity) || 1
  const cartItem = user.shoppingCart.find(item => item.product.toString() === productId)
  if (cartItem) {
    cartItem.quantity += quantity
  } else {
    user.shoppingCart.push({ product: productId, quantity })
  }
  await user.save()
  res.redirect('/user/account/cart')
})

// Update Cart Item Quantity
router.post('/cart/update/:productId', requireUserLogin, async (req, res) => {
  const user = await userModel.findOne({ email: req.userEmail })
  const productId = req.params.productId
  const quantity = parseInt(req.body.quantity)
  const cartItem = user.shoppingCart.find(item => item.product.toString() === productId)
  if (cartItem && quantity > 0) {
    cartItem.quantity = quantity
    await user.save()
  }
  res.redirect('/user/account/cart')
})

// Remove Cart Item
router.post('/cart/remove/:productId', requireUserLogin, async (req, res) => {
  const user = await userModel.findOne({ email: req.userEmail })
  const productId = req.params.productId
  user.shoppingCart = user.shoppingCart.filter(item => item.product.toString() !== productId)
  await user.save()
  res.redirect('/user/account/cart')
})

// Clear Cart
router.post('/cart/clear', requireUserLogin, async (req, res) => {
  const user = await userModel.findOne({ email: req.userEmail })
  user.shoppingCart = []
  await user.save()
  res.redirect('/user/account/cart')
})

// Checkout order placement
router.post('/checkout', requireUserLogin, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.userEmail }).populate('shoppingCart.product')
    if (!user) return res.status(401).json({ error: 'User not found' })

    // Validate delivery address fields
    const { full_name, address, country, city, postal_code, phone, payment_method, cc_number, cc_expiry, cc_cvv, billing_address_details } = req.body
    if (!full_name || !address || !country || !city || !postal_code || !phone || !payment_method) {
      return res.status(400).json({ error: 'Missing required delivery or payment information' })
    }
    if (payment_method === 'cc' && (!cc_number || !cc_expiry || !cc_cvv)) {
      return res.status(400).json({ error: 'Missing credit card information' })
    }
    if (!user.shoppingCart.length) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    // Calculate total amount
    let amount = 0
    const items = user.shoppingCart.map(item => {
      amount += item.product.price * item.quantity
      return {
        product: item.product._id,
        quantity: item.quantity
      }
    })

    // Compose address string
    const deliveryAddress = `${full_name}, ${address}, ${city}, ${postal_code}, ${country}, Phone: ${phone}`
    const billingAddress = billing_address_details ? billing_address_details : deliveryAddress

    // Add to purchase history
    user.purchaseHistory.push({
      items,
      address: billingAddress,
      amount,
      paymentMethod: payment_method === 'cc' ? 'Credit Card' : 'Cash on Delivery',
      date: new Date()
    })
    // Clear cart
    user.shoppingCart = []
    await user.save()

    // Save order message for admin
    await Message.create({
      type: 'order',
      subject: 'New Order Placed',
      body: `User: ${user.name} (${user.email})\nDelivery Address: ${deliveryAddress}\nBilling Address: ${billingAddress}\nPayment Method: ${payment_method === 'cc' ? 'Credit Card' : 'Cash on Delivery'}\nOrder Amount: ₹${amount.toFixed(2)}\nOrder Items: ${items.map(item => `Product: ${item.product}, Quantity: ${item.quantity}`).join('; ')}`,
      userEmail: user.email
    });

    // Send admin email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    const orderDetails = items.map(item => `Product: ${item.product}, Quantity: ${item.quantity}`).join('<br>')
    const mailOptions = {
      from: `Order Notification <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Order Placed',
      html: `<h2>New Order Received</h2>
        <b>User:</b> ${user.name} (${user.email})<br>
        <b>Delivery Address:</b> ${deliveryAddress}<br>
        <b>Billing Address:</b> ${billingAddress}<br>
        <b>Payment Method:</b> ${payment_method === 'cc' ? 'Credit Card' : 'Cash on Delivery'}<br>
        <b>Order Amount:</b> ₹${amount.toFixed(2)}<br>
        <b>Order Items:</b><br>${orderDetails}`
    }
    await transporter.sendMail(mailOptions)

    return res.json({ success: true, message: 'Order placed successfully!' })
  } catch (err) {
    console.error('Checkout error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// User Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token')
  res.redirect('/')
})

module.exports = router
