const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productID: { type: String, required: true, unique: true },
    sellerID: { type: String, required: true },
    productName: { type: String, required: true },
    productDescription: { type: String, required: true, minlength: 10 },
    productPrice: { type: Number, required: true },
    availableColors: [String],
    stockAvailable: { type: Number, required: true }
});


module.exports = Product = mongoose.model('product', productSchema);