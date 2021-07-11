const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const extendSchema = require('mongoose-extend-schema');
const UserSchema = require('../models/UserModel').UserSchema;

const Customer = extendSchema(UserSchema, {
  Housings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Housing',
    },
  ],
  Contarcts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Contracts',
    },
  ],
});

module.exports = mongoose.model('Customers', Customer);
