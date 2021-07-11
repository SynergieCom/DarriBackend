const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const extendSchema = require('mongoose-extend-schema');
const UserSchema = require('../models/UserModel').UserSchema;

const Engineer = extendSchema(UserSchema, {
  NationalEngineeringId: Number,
  Bio: String,
  Speciality: String,
  NbExperienceYears: Number,
  Cv: String,
  projects: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Projects',
    },
  ],
});

module.exports = mongoose.model('Engineers', Engineer);
