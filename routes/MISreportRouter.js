const router = require("express").Router();
const Admin = require("../models/admin");
const MISreport = require("../models/mis_report");
const bcrypt = require("bcryptjs");

//To get MIS reports from the database but only by admin

router.get("/", async (req, res) => {
    try {
        let { email, password } = req.body;
        const admin = await Admin.findOne({ email: email });

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!admin)
            return res.status(400).json({ msg: "Access Denied. Please check your login information again" });

        if (!isMatch)
            return res.status(400).json({ msg: "Password is incorrect! Please try again" })


        const report = await MISreport.findOne({ _id: "5f6b23997271ef36f4cdbd98" });
        return res.status(200).json({ logins: report.logins, sale: report.productSale, msg: "Success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;