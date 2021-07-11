var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var LocationSchema = require('./LocationModel').LocationSchema

var AddressSchema = new Schema({
    Street: String,
    City: String,
    State: String,
    ZipCode: Number,
    Location: LocationSchema
});

const AddressModel = mongoose.model('Address', AddressSchema);
module.exports = {Address: AddressModel, AddressSchema}