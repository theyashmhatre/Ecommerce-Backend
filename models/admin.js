const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String },
    passToken: { type: String, default: "" },
    type: { type: String }
});


module.exports = Admin = mongoose.model('admin', adminSchema);