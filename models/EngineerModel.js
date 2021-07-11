var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var extendSchema = require("mongoose-extend-schema");
var UserSchema= require("../models/UserModel").UserSchema;

var Engineer = extendSchema(UserSchema, {
    NationalEngineeringId: Number,
    Bio: String,
    Speciality: String,
    NbExperienceYears: Number,
    Cv: String,
    projects: [
        {
            type: Schema.Types.ObjectId,
            ref: "Projects"
        }
    ],
});


module.exports = mongoose.model("Engineers", Engineer);
