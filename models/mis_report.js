const mongoose = require("mongoose");

const misreportSchema = new mongoose.Schema({
    logins: { type: Number, default: 0 },
    productSale: { type: Number, default: 0 }
});


module.exports = MISreport = mongoose.model('MISreport', misreportSchema);