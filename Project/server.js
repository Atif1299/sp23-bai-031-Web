const express = require('express')
const dotenv = require('dotenv')
dotenv.config()

const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/cv', (req, res) => {
  res.render('cv')
})

app.get('/checkout', (req, res) => {
  res.render('checkout')
})

app.listen(5000)
