const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('../models/AddressModel').AddressSchema;

const Project = new Schema({
  ProjectName: String,
  Address: AddressSchema,
  Description: String,
  BuildingSurface: Number,
  LandArea: Number,
  Phase: Number,
  Type: String,
  Status: String,
  imgCollection: {
    type: Array,
  },
});

module.exports = mongoose.model('Projects', Project);
