const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
  Longitude: Number,
  Latitude: Number,
});

const LocationModel = mongoose.model('Location', LocationSchema);
module.exports = {LocationSchema, Location: LocationModel};
