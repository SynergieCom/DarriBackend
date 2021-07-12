const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Contract = new Schema({
  Type: String,
  PdfCopy: String,
  Price: Number,
  Date: Date,
  Housing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Housings',
  },
  User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
});

module.exports = mongoose.model('Contracts', Contract);
