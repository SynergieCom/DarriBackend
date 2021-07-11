const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Contarct = new Schema({
  Type: String,
  PdfCopy: String,
  Price: Number,
  Date: Date,
});

module.exports = mongoose.model('Contracts', Contarct);
