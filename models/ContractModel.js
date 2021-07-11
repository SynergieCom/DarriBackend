var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Contarct =new Schema(
    {
        Type:String,
        PdfCopy: String,
        Price: Number,
        Date: Date,
    }
);


module.exports = mongoose.model("Contracts",Contarct)