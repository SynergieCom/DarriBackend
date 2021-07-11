var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var extendSchema = require("mongoose-extend-schema");
var UserSchema= require("../models/UserModel").UserSchema;

var Customer = extendSchema(UserSchema, {
    Housings: [
        {
            type: Schema.Types.ObjectId,
            ref: "Housing"
        }
    ],
    Contarcts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Contracts"
        }
    ]
});


module.exports = mongoose.model("Customers", Customer);
