const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const extendSchema = require('mongoose-extend-schema');
const UserSchema = require('../models/UserModel').User;
const Payments = require('../models/PaymentModel');
const Projects = require('../models/ProjectModel');

const Architect = extendSchema(UserSchema, {
  NationalEngineeringId: Number,
  Bio: String,
  Type: String,
  NbExperienceYears: Number,
  Cv: String,
  Subscribed: Boolean,
  SubscriptionExpirationDate: Date,
  Projects: [
    {
      type: Schema.Types.ObjectId,
      ref: Projects,
    },
  ],
  Payments: [
    {
      type: Schema.Types.ObjectId,
      ref: Payments,
    },
  ],
});

module.exports = mongoose.model('Architects', Architect);
