const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const Admin = require("../models/admin");
const emailController = require("../email/emailController");
const sendEmail = require("../email/sendEmail");
const templates = require("../email/emailTemplates");
const msgs = require("../email/emailMsgs");
const { nanoid } = require("nanoid");


router.post("/register", async (req, res) => {

    try {
        let { email, password, passwordCheck, name, type } = req.body;

        //validate and check all scenarios

        if (!email || !password || !passwordCheck)
            return res.status(400).json({ msg: "Please fill up all the fields and retry." });
        if (password.length < 6)
            return res.status(400).json({ msg: "Password needs to be atleast 6 characters long" });
        if (password !== passwordCheck)
            return res
                .status(400)
                .json({ msg: "Please enter the same password twice" });

        const existingUser = await Admin.findOne({ email: email });
        if (existingUser)
            return res
                .status(400)
                .json({ msg: "This account already exists." });
        if (!name) name = email;

        //Salting and Hashing is used using Bcrypt so as to store passwords in encrypted format.

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const newAdmin = new Admin({
            email: email.toLowerCase(),
            password: passwordHash,
            name: name,
            type: "admin"
        });

        const savedAdmin = await newAdmin.save();
        sendEmail(email, templates.confirm(savedUser._id));
        res.status(200).json({ savedAdmin, msg: msgs.confirm });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }


});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        //validate

        if (!email || !password)
            return res.status(400).json({ msg: "Please fill up all the field and retry" });

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin)
            return res.status(400).json({ msg: "No account with this email has been registered." });

        const isMatch = await bcrypt.compare(password, admin.password); //Compare both passwords using bcrypt's compare func
        if (!isMatch)
            return res
                .status(400)
                .json({ msg: "Invalid Credentials" });

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET); //get a token
        res.status(200).json({
            token,
            admin: {
                id: admin._id,
                name: admin.name
            },
            msg: msgs.confirmed
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//to check if the token allotted to a specific email is valid or not
router.post("/tokenIsValid", async (req, res) => {
    try {
        const token = req.header("x-auth-token");
        if (!token) return res.json(false);

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) return res.json(false);

        const admin = await Admin.findById(verified.id);
        if (!admin) return res.json(false);

        return res.json(true);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/", auth, async (req, res) => {
    const admin = await Admin.findById(req.user);  //req.user is the id that we get from auth
    if (!admin)
        return res.status(400).json({ msg: "Error 404 : User Not Found" });
    res.json({
        name: admin.name,
        id: admin._id,
    });
});

//when the user clicks on forgot password, email is sent after checking all the criteria
router.post("/forgot", async (req, res) => {
    let email = req.body.email;
    let token = nanoid(8);

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin)
        return res
            .status(400)
            .json({ msg: "This email does not exist" });

    let id = admin._id;

    await Admin.findOneAndUpdate({ email: email.toLowerCase() }, { passToken: token });
    sendEmail(email, templates.passwordResetLink(id, token));
    return res.status(200).json({ msg: "Verification Link sent successfully!" });
});


//verification link sent to the user to verify him/herself

router.post("/reset/verify/:id/:token", async (req, res) => {

    try {
        let { id, token } = req.params; //get params from the url
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            const admin = await Admin.findById(id);

            if (!admin)
                return res.json({ msg: msgs.couldNotFind + msgs.redirecting, verify: false });

            console.log(admin.passToken);
            console.log(token);
            if (admin.passToken !== token) {
                console.log("inside");
                return res
                    .json({ msg: "Link is not valid. We've already sent you a new one!" + msgs.redirecting, verify: false });
            }

            if (admin.passToken === token) {
                return res.status(200).json({ msg: "Link Verified", verify: true });
            }
        }
        return res.json({ msg: "User does not exist. Invalid ID" + msgs.redirecting, verify: false });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//after user clicks on reset password after entering new password
router.post("/reset/password", async (req, res) => {

    try {
        let { password, passwordCheck, id } = req.body;
        console.log(id);
        if (!password || !passwordCheck)
            return res.status(400).json({ msg: "Please fill up all the fields and retry" });

        if (password.length < 6)
            return res.status(400).json({ msg: "Password needs to be atleast 6 characters long" });

        if (password !== passwordCheck)
            return res.status(400).json({ msg: "Please enter the same password twice." });

        // validate mongoDB ID criteria
        if (id.match(/^[0-9a-fA-F]{24}$/)) {

            const admin = await Admin.findById(id);

            if (!admin)
                return res.status(400).json({ msg: "This account does not exist." });

            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(password, salt);
            const newToken = await nanoid(8);
            await Admin.findOneAndUpdate({ "email": admin.email }, { $set: { "password": passwordHash, "passToken": newToken } });
            sendEmail(admin.email, templates.passwordResetDone());
            return res.status(200).json({ msg: "Password Reset Successful. You'll be redirected in 5 seconds..." });
        }
        return res.json({ msg: "User does not exist. Invalid ID" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;