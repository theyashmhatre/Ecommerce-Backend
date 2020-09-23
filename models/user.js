const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String },
    type: { type: String, enum: ["user", "seller"], required: true },
    confirmed: { type: Boolean, required: true, default: false },
    passToken: { type: String, default: "" }
});


module.exports = User = mongoose.model('user', userSchema);