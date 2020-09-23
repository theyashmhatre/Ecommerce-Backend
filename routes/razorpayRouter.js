const router = require("express").Router();
const Razorpay = require("razorpay");
const { nanoid } = require("nanoid");
const crypto = require("crypto");
const Product = require("../models/product");
const Payment = require("../models/payment");
const MISreport = require("../models/mis_report");
const User = require("../models/user");
const sendEmail = require("../email/sendEmail");
const templates = require("../email/emailTemplates");

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY,
    key_secret: process.env.RAZOR_SECRET,
});

router.post("/verification", (req, res) => {
    //do a validation
    const Secret = process.env.WEBHOOK_SECRET;
    const shasum = crypto.createHmac('sha256', Secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    console.log(req.body);

    console.log(digest, req.headers['x-razorpay-signature']);

    if (digest === req.headers['x-razorpay-signature']) {
        console.log("Request is legit!");

    }
    else {
        //pass it 
    }
    res.json({ status: "ok" }); // this should be inside 'if' block but now it's for demo 

});

router.post("/order/payment", async (req, res, callback) => {
    try {
        let { userID, productID, selectedColor } = req.body;
        const payment_capture = 1;
        currency = "INR";
        var productInfo;

        await Product.findOne({ productID: productID }).then((product) => {
            productInfo = product;
        });
        console.log(productInfo);
        const amount = productInfo.productPrice;

        if (!productInfo)
            return res.status(400).json("No product exists with this ID.");

        const user = await User.findOne({ _id: userID });

        if (!user)
            return res.status(400).json({ msg: "Account does not exist. Please log in and then retry your payment." })

        const options = {
            amount: amount * 100, // Since 1re = 100p
            currency,
            receipt: nanoid(10),
            payment_capture
        };
        const response = await razorpay.orders.create(options).then((response) => {
            console.log(response);
            const newPayment = new Payment({
                userID: userID,
                payment_id: response.id,
                amount: response.amount,
                amount_paid: response.amount_paid,
                currency: response.currency,
                receipt: response.receipt,
                productID: productID,
                sellerID: productInfo.sellerID,
                productPrice: productInfo.productPrice,
                selectedColor: selectedColor
            });
            MISreport.findOneAndUpdate({ _id: "5f6b23997271ef36f4cdbd98" }, { $inc: { productSale: 1 } }, { new: true }, function (err, response) {
                if (err) {
                    callback(err);
                } else {
                    callback(response);
                }
            });
            const savedPayment = newPayment.save();
            Product.findOneAndUpdate({ productID: productID }, { $inc: { stockAvailable: -1 } }, { new: true }, function (err, response) {
                if (err) {
                    callback(err);
                } else {
                    callback(response);
                }
            });

            sendEmail(user.email, templates.orderSuccessful(paymentID = response.id, amount_paid = response.amount));

            res.status(200).json({ newPayment });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});




module.exports = router;