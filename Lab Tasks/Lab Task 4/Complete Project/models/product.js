const mongoose = require('mongoose')

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^a-z0-9\-]/g, '')    // Remove all non-alphanumeric chars except -
    .replace(/-+/g, '-')             // Replace multiple - with single -
    .replace(/^-+|-+$/g, '');        // Trim - from start/end
}

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // main image path
  hoverImage: { type: String }, // optional hover image path
  category: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  quickAdd: { type: Boolean, default: false },
  slug: { type: String, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

productSchema.pre('save', async function(next) {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = slugify(this.name)
    let slug = baseSlug
    let count = 1
    // Ensure uniqueness
    while (await mongoose.models.Product.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`
    }
    this.slug = slug
  }
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('Product', productSchema) 