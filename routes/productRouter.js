const router = require("express").Router();
const Product = require("../models/product");
const User = require("../models/user");

//Add products only by the seller

router.post("/add", async (req, res) => {
    try {
        let { userID, productID, sellerID, productName, productDescription, productPrice, availableColors, stockAvailable } = req.body;

        const user = await User.findOne({ _id: userID });

        if (user.type === "user")
            return res.status(400).json({ msg: "Only sellers can add products. Please register yourself as a seller." });
        if (!productID || !sellerID || !productName || !productDescription || !stockAvailable)
            return res.status(400).json({ msg: "Please fill all the fields and retry" });
        if (productDescription.length < 20)
            return res.status(400).json({ msg: "Desciption needs to be atleast 20 characters long" });

        const newProduct = new Product({
            productID,
            sellerID,
            productName,
            productDescription,
            productPrice,
            availableColors,
            stockAvailable
        });

        const savedProduct = await newProduct.save();
        res.status(200).json({ savedProduct, msg: "Product Added!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;