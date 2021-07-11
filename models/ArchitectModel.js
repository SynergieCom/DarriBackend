const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const extendSchema = require('mongoose-extend-schema');
const UserSchema = require('../models/UserModel').UserSchema;

const Architect = extendSchema(UserSchema, {
  NationalEngineeringId: Number,
  Bio: String,
  Type: String,
  NbExperienceYears: Number,
  Cv: String,
  projects: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Projects',
    },
  ],
});

module.exports = mongoose.model('Architects', Architect);
