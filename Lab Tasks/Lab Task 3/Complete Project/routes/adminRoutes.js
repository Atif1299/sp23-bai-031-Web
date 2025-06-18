const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const adminModel = require('../models/admin')
const fs = require('fs')
const path = require('path')
const Product = require('../models/product')
const Message = require('../models/message')

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const token = req.cookies.adminToken
  if (!token) {
    return res.redirect('/admin/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const admin = await adminModel.findOne({ email: decoded.email })
    if (!admin) {
      res.clearCookie('adminToken')
      return res.redirect('/admin/login')
    }
    req.admin = admin
    next()
  } catch (error) {
    res.clearCookie('adminToken')
    return res.redirect('/admin/login')
  }
}

// Admin Login page
router.get('/login', (req, res) => {
  res.render('admin_login', {
    title: 'Admin Login',
    message: '',
    stylesheets: ['/css/home.css', '/css/login.css'],
    layout: 'layout',
  })
})

// Admin Login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.render('admin_login', {
      message: 'Missing email or password',
      stylesheets: ['/css/home.css', '/css/login.css'],
      layout: 'layout',
    })
  }

  try {
    const admin = await adminModel.findOne({ email })
    if (!admin) {
      return res.render('admin_login', {
        message: 'Admin with these information not exist',
        stylesheets: ['/css/home.css', '/css/login.css'],
        layout: 'layout',
      })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.render('admin_login', {
        message: 'Invalid credentials',
        stylesheets: ['/css/home.css', '/css/login.css'],
        layout: 'layout',
      })
    }

    // Clear any existing user session
    res.clearCookie('token', { path: '/' })
    const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })

    res.redirect('/admin/panel')
  } catch (error) {
    console.error(error)
    res.render('admin_login', {
      message: 'Internal Server Error',
      stylesheets: ['/css/home.css', '/css/login.css'],
      layout: 'layout',
    })
  }
})

// Admin Signup page
router.get('/signup', (req, res) => {
  res.render('admin_signup', {
    title: 'Admin Signup',
    message: '',
    stylesheets: ['/css/home.css', '/css/login.css'],
    layout: 'layout',
  })
})

// Admin Signup handler
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.render('admin_signup', {
      message: 'Missing required fields',
      stylesheets: ['/css/home.css', '/css/login.css'],
      layout: 'layout',
    })
  }

  // Password strength validation
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
    return res.render('admin_signup', {
      message: 'Password must be at least 8 characters and include both letters and numbers.',
      stylesheets: ['/css/home.css', '/css/login.css'],
      layout: 'layout',
    })
  }

  try {
    const existingAdmin = await adminModel.findOne({ email })
    if (existingAdmin) {
      return res.render('admin_signup', {
        message: 'Admin with this information already exists please login',
        stylesheets: ['/css/home.css', '/css/login.css'],
        layout: 'layout',
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    await adminModel.create({
      name,
      email,
      password: hash,
    })

    res.redirect('/admin/login')
  } catch (error) {
    console.error(error)
    res.render('admin_signup', {
      message: 'Internal Server Error',
      stylesheets: ['/css/home.css', '/css/login.css'],
      layout: 'layout',
    })
  }
})

// Admin Panel
router.get('/panel', authenticateAdmin, (req, res) => {
  res.render('admin_panel', { layout: 'admin_layout', admin: req.admin, request: req })
})

// Admin Logout
router.get('/logout', (req, res) => {
  res.clearCookie('adminToken', { path: '/' })
  res.redirect('/')
})

// Route to list images for the image picker
router.get('/images', (req, res) => {
  const imagesDir = path.join(__dirname, '../public/resources/files')
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to list images' })
    }
    // Filter for image files only (jpg, jpeg, png, gif, webp)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    res.json(imageFiles)
  })
})

// List all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// Create a new product
router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body)
    await product.save()
    res.status(201).json(product)
  } catch (err) {
    res.status(400).json({ error: 'Failed to create product', details: err.message })
  }
})

// Update a product
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(400).json({ error: 'Failed to update product', details: err.message })
  }
})

// Delete a product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete product', details: err.message })
  }
})

// Admin: Get all messages for contact messages page
router.get('/messages', async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

// Admin: Complaints (Contact Form Messages)
router.get('/messages/complaints', authenticateAdmin, async (req, res) => {
  const complaints = await Message.find({ type: 'contact' }).sort({ createdAt: -1 });
  res.render('admin_complaints', { complaints, layout: 'admin_layout', admin: req.admin, request: req });
});

// Admin: Orders (Order Messages)
router.get('/messages/orders', authenticateAdmin, async (req, res) => {
  const orders = await Message.find({ type: 'order' }).sort({ createdAt: -1 });
  res.render('admin_orders', { orders, layout: 'admin_layout', admin: req.admin, request: req });
});

module.exports = router
