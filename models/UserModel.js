var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var AddressSchema = require("../models/AddressModel").AddressSchema;

var User = new Schema({
    RefUser: String,
    Cin: Number,
    Username:String,
    FirstName: String,
    LastName: String,
    Password:String,
    Email:String,
    PhoneNumber: Number,
    Role:String,
    Address: AddressSchema,
    img:String
});

const UserSchema = mongoose.model("Users", User);
module.exports = {User,UserSchema}
