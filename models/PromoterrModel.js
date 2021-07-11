const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('../models/AddressModel').AddressSchema;

const Promoter = new Schema({
  ResponsibleCin: Number,
  ResponsibleName: String,
  CreationYear: Date,
  CommercialName: String,
  Activity: String,
  HeadquartersAddress: AddressSchema,
  RegionalOffice: String,
  Denomination: String,
  TaxSituation: String,
  Email: String,
  Password: String,
  PhoneNumber: Number,
  Subscribed: Boolean,
  SubscriptionExpirationDate: Date,
  img: String,
  projects: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Projects',
    },
  ],
});

module.exports = mongoose.model('Promoters', Promoter);
