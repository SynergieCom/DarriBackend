var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var AddressSchema = require("../models/AddressModel").AddressSchema;

var Housing = new Schema({
    Description : String,
    Address:AddressSchema,
    NbRooms: Number,
    Nbfloor: Number,
    ParkingSpace : Number,
    LivingArea: Number,
    Type: String,
    Status: String,
    Price: Number,
    MonthlyRent: Number,
    ConstructionYear: Date,
    RentalStartDate: Date,
    RentalFinishDate: Date,
    PublishedDate: Date.now(),
    imgCollection: {
        type: Array
    }
});

module.exports = mongoose.model("Housings", Housing);
