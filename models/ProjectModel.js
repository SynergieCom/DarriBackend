var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var AddressSchema = require("../models/AddressModel").AddressSchema;

var Project = new Schema({
    ProjectName: String,
    Address:AddressSchema,
    Description : String,
    BuildingSurface: Number,
    LandArea: Number,
    Phase: Number,
    Type: String,
    Status: String,
    imgCollection: {
        type: Array
    }
});

module.exports = mongoose.model("Projects", Project);
