const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const extendSchema = require('mongoose-extend-schema');
const UserSchema = require('../models/UserModel').User;

const Customer = extendSchema(UserSchema, {
  Contarcts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Contracts',
    },
  ],
});

module.exports = mongoose.model('Customers', Customer);
