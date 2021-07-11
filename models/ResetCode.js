const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResetCode = new Schema({
  Id: String,
  Code: String,
});

module.exports = mongoose.model('resetCode', ResetCode);
