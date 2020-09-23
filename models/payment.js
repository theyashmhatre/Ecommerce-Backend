const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    userID: { type: String },
    payment_id: { type: String, unique: true },
    amount: { type: Number },
    amount_paid: { type: Number },
    currency: { type: String },
    receipt: { type: String },
    productID: { type: String },
    sellerID: { type: String },
    productPrice: { type: String },
    selectedColor: { type: String },
    address: { type: String }
});


module.exports = Payment = mongoose.model('payment', paymentSchema);