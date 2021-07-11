const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('./AddressModel').AddressSchema;

const Payment = new Schema({
  PaymentMethod: String,
  NameOnCard: String,
  Email: String,
  Address: AddressSchema,
  creditCard: Number,
  CardType: String,
  SecurityCode: Number,
  ExpirationDate: Date,
  Country: String,
  Amount: Number,
  CreationDate: Date,
});

module.exports = mongoose.model('Payments', Payment);
