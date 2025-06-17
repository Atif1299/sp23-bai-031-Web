const express = require('express')
const router = express.Router()
const Contact = require('../models/contact')
const nodemailer = require('nodemailer')
const Message = require('../models/message')

// Helper: Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Contact page
router.get('/', (req, res) => {
  res.render('contact', {
    title: 'Contact Us - People Tree EU',
    stylesheets: ['/css/home.css', '/css/contact.css'],
    scripts: ['/js/home.js', '/js/contact.js'],
  })
})

// Contact form submission
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body
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
    const newContact = new Contact({ firstName, lastName, email, message })
    await newContact.save()

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
    await transporter.sendMail({
      from: `Contact Form <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Contact Message',
      text: `New message from ${firstName} ${
        lastName || ''
      } <${email}>:\n\n${message}`,
    })

    // After sending email:
    await Message.create({
      type: 'contact',
      subject: 'Contact Form Message',
      body: `Name: ${(req.body.firstName || '') + (req.body.lastName ? ' ' + req.body.lastName : '')}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`,
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
