const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('../models/AddressModel').AddressSchema;

const User = new Schema({
  RefUser: String,
  Cin: Number,
  Username: String,
  FirstName: String,
  LastName: String,
  Password: String,
  Email: String,
  PhoneNumber: Number,
  Role: String,
  Address: AddressSchema,
  img: String,
});

const UserSchema = mongoose.model('Users', User);
module.exports = {User, UserSchema};
