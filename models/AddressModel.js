const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const LocationSchema = require('./LocationModel').LocationSchema;

const AddressSchema = new Schema({
  Street: String,
  City: String,
  State: String,
  ZipCode: Number,
  Location: LocationSchema,
});

const AddressModel = mongoose.model('Address', AddressSchema);
module.exports = {Address: AddressModel, AddressSchema};
