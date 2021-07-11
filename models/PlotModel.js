const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('../models/AddressModel').AddressSchema;

const Pot = new Schema({
  Description: String,
  Address: AddressSchema,
  BuildingSurface: Number,
  LandArea: Number,
  Type: String,
  Status: String,
  Price: Number,
  PublishedDate: Date.now(),
  ConstructionYear: Date,
  imgCollection: {
    type: Array,
  },
});

module.exports = mongoose.model('Pots', Pot);
