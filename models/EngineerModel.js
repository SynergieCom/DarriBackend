const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const extendSchema = require('mongoose-extend-schema');
const UserSchema = require('../models/UserModel').User;

const Engineer = extendSchema(UserSchema, {
  NationalEngineeringId: Number,
  Bio: String,
  Speciality: String,
  NbExperienceYears: Number,
  Cv: String,
  Subscribed: Boolean,
  SubscriptionExpirationDate: Date,
  projects: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Projects',
    },
  ],
  payments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Payments',
    },
  ],
});

module.exports = mongoose.model('Engineers', Engineer);
