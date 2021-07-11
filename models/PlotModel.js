var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var AddressSchema = require("../models/AddressModel").AddressSchema;

var Pot = new Schema({
    Description : String,
    Address:AddressSchema,
    BuildingSurface: Number,
    LandArea: Number,
    Type: String,
    Status: String,
    Price: Number,
    PublishedDate: Date.now(),
    ConstructionYear: Date,
    imgCollection: {
        type: Array
    }
});

module.exports = mongoose.model("Pots", Pot);
