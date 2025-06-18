const express = require('express')
const router = express.Router()
const Contact = require('../models/contact')
const nodemailer = require('nodemailer')
const Message = require('../models/message')
// Import requireUserLogin middleware from userRoutes.js
const requireUserLogin = require('./userRoutes').requireUserLogin
const userModel = require('../models/user')
const Product = require('../models/product')

// Helper: Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Contact page (only for logged-in users)
router.get('/', requireUserLogin, async (req, res) => {
  // Fetch user's order IDs from purchase history
  const user = await userModel.findOne({ email: req.userEmail })
  let orderIds = []
  if (user && user.purchaseHistory && user.purchaseHistory.length > 0) {
    orderIds = user.purchaseHistory.map((order, idx) => ({
      id: order.date ? order.date.getTime() : idx + 1,
      label: `Order #${idx + 1} - ${order.date ? order.date.toLocaleString() : ''}`
    }))
  }
  res.render('contact', {
    title: 'Contact Us - People Tree EU',
    stylesheets: ['/css/home.css', '/css/contact.css'],
    scripts: ['/js/home.js', '/js/contact.js'],
    orderIds
  })
})

// Contact form submission (only for logged-in users)
router.post('/', requireUserLogin, async (req, res) => {
  console.log('POST /contact route hit');
  console.log('Received body:', req.body);
  if (req.body.debugOrderId) {
    console.log('debugOrderId from form:', req.body.debugOrderId);
  }
  try {
    const { firstName, lastName, email, message, orderId } = req.body
    // Backend validation
    if (!firstName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'First name, email, and message are required.',
      })
    }
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email format.' })
    }
    // Save to DB
    const newContact = new Contact({ firstName, lastName, email, message, orderId })
    await newContact.save()

    // Fetch order details if orderId is present and valid
    let orderDetailsText = ''
    let orderDetailsHtml = ''
    if (orderId) {
      const user = await userModel.findOne({ email: req.userEmail })
      if (user && user.purchaseHistory && user.purchaseHistory.length > 0) {
        console.log('Submitted orderId:', orderId)
        console.log('User purchaseHistory order times:', user.purchaseHistory.map(o => o.date && o.date.getTime()))
      }
      let order = null
      if (user && user.purchaseHistory && user.purchaseHistory.length > 0) {
        order = user.purchaseHistory.find(o => o.date && o.date.getTime && o.date.getTime().toString() === orderId)
      }
      if (order) {
        orderDetailsText = `\n--- Order Details ---\nOrder Date: ${order.date ? order.date.toLocaleString() : ''}\nAmount: ₹${order.amount}\nPayment: ${order.paymentMethod}\nAddress: ${order.address}\nItems:`
        orderDetailsHtml = `<h3>Order Details</h3><table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;'><tr><th>Product</th><th>Quantity</th></tr>`
        for (const item of order.items) {
          let productName = item.product
          try {
            const prod = await Product.findById(item.product)
            if (prod) productName = prod.name
          } catch (e) {}
          orderDetailsText += `\n  - Product: ${productName}, Quantity: ${item.quantity}`
          orderDetailsHtml += `<tr><td>${productName}</td><td>${item.quantity}</td></tr>`
        }
        orderDetailsHtml += `</table><p><b>Date:</b> ${order.date ? order.date.toLocaleString() : ''}<br><b>Amount:</b> ₹${order.amount}<br><b>Payment:</b> ${order.paymentMethod}<br><b>Address:</b> ${order.address}</p>`
      }
    }

    // Admin notification (nodemailer)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    let emailText = `New message from ${firstName} ${lastName || ''} <${email}>:\n\n${message}`
    let emailHtml = `<p>New message from <b>${firstName} ${lastName || ''}</b> &lt;${email}&gt;:</p><p>${message}</p>`
    if (orderDetailsText) {
      emailText = `Order Date: ${orderId}\n` + emailText + orderDetailsText
      emailHtml += orderDetailsHtml
    }
    await transporter.sendMail({
      from: `Contact Form <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Contact Message',
      text: emailText,
      html: emailHtml
    })

    // After sending email:
    let msgBody = `Name: ${(req.body.firstName || '') + (req.body.lastName ? ' ' + req.body.lastName : '')}\nEmail: ${req.body.email}`
    if (orderDetailsText) msgBody += `\nOrder Date: ${orderId}${orderDetailsText}`
    msgBody += `\nMessage: ${req.body.message}`
    await Message.create({
      type: 'contact',
      subject: 'Contact Message',
      body: msgBody,
      userEmail: req.body.email
    })

    res.json({ success: true, message: 'Message sent successfully!' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
})

// Admin messages viewing (simple cookie check)
router.get('/admin/messages', async (req, res) => {
  if (req.cookies.admin !== 'true') {
    return res.status(403).send('Forbidden: Admins only')
  }
  const messages = await Contact.find().sort({ createdAt: -1 })
  let html = '<h1>Contact Messages</h1>'
  html += '<ul>'
  for (const msg of messages) {
    html += `<li><b>${msg.firstName} ${msg.lastName || ''}</b> (${
      msg.email
    })<br>${msg.message}<br><i>${msg.createdAt.toLocaleString()}</i></li><hr>`
  }
  html += '</ul>'
  res.send(html)
})

module.exports = router
