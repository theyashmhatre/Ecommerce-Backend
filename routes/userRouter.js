const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const User = require("../models/user");
const emailController = require("../email/emailController");
const sendEmail = require("../email/sendEmail");
const templates = require("../email/emailTemplates");
const msgs = require("../email/emailMsgs");
const { nanoid } = require("nanoid");
const MISreport = require("../models/mis_report");
const Payment = require("../models/payment");

router.post("/register", async (req, res) => {

    try {
        let { email, password, passwordCheck, name, type } = req.body;
        console.log(email, password, type);

        //validate

        if (!email || !password || !passwordCheck)
            return res.status(400).json({ msg: "Please fill up all the fields and retry." });
        if (password.length < 6)
            return res.status(400).json({ msg: "Password needs to be atleast 6 characters long" });
        if (password !== passwordCheck)
            return res
                .status(400)
                .json({ msg: "Please enter the same password twice" });

        const existingUser = await User.findOne({ email: email });
        if (existingUser)
            return res
                .status(400)
                .json({ msg: "This account already exists." });
        if (!name) name = email;

        //Salting and hashing is used to store data in an encrypted format in the db
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            email: email.toLowerCase(),
            password: passwordHash,
            name: name,
            type: type
        });

        const savedUser = await newUser.save();
        sendEmail(email, templates.confirm(savedUser._id)); //Send mail if all the conditions satisfy
        res.status(200).json({ savedUser, msg: msgs.confirm });
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

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(400).json({ msg: "No account with this email has been registered." });

        //Compare passwords using bcrypt's compare function
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res
                .status(400)
                .json({ msg: "Invalid Credentials" });

        if (!user.confirmed) {
            // sendEmail(user.email, templates.confirm(user._id));
            return res.status(400).json({ msg: msgs.resend });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);


        //update by 1 after each login
        await MISreport.findOneAndUpdate({ _id: "5f6b23997271ef36f4cdbd98" }, { $inc: { logins: 1 } }, { new: true });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name
            },
            msg: msgs.confirmed
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Delete account feature
router.post("/delete", auth, async (req, res) => {
    try {
        let { email } = req.body;
        const user = await User.findById(req.user);


        if (email.toLowerCase() !== user.email.toLowerCase())
            return res
                .status(400)
                .json({ msg: "Invalid Email. Please enter the correct email and retry." });

        const deletedUser = await User.findByIdAndDelete(user._id);
        const deletedURL = await Url.deleteMany({ userId: user._id });
        // sendEmail(email, templates.deleted());
        return res.status(200).json({ msg: msgs.deleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/tokenIsValid", async (req, res) => {
    try {
        const token = req.header("x-auth-token");
        if (!token) return res.json(false);

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) return res.json(false);

        const user = await User.findById(verified.id);
        if (!user) return res.json(false);

        return res.json(true);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/", auth, async (req, res) => {
    const user = await User.findById(req.user);
    if (!user)
        return res.status(400).json({ msg: "Error 404 : User Not Found" });
    res.json({
        name: user.name,
        id: user._id,
    });
});

//when the user clicks on the forgot password

router.post("/forgot", async (req, res) => {
    let email = req.body.email;
    let token = nanoid(8);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
        return res
            .status(400)
            .json({ msg: "This email does not exist" });

    let id = user._id;

    await User.findOneAndUpdate({ email: email.toLowerCase() }, { passToken: token });
    // sendEmail(email, templates.passwordResetLink(id, token));
    return res.status(200).json({ msg: "Verification Link sent successfully!" });
});


//the link that is sent to user's email to verify him/herself

router.post("/reset/verify/:id/:token", async (req, res) => {

    try {
        let { id, token } = req.params;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            const user = await User.findById(id);

            if (!user)
                return res.json({ msg: msgs.couldNotFind + msgs.redirecting, verify: false });

            console.log(user.passToken);
            console.log(token);
            if (user.passToken !== token) {
                console.log("inside");
                return res
                    .json({ msg: "Link is not valid. We've already sent you a new one!" + msgs.redirecting, verify: false });
            }

            if (user.passToken === token) {
                return res.status(200).json({ msg: "Link Verified", verify: true });
            }
        }
        return res.json({ msg: "User does not exist. Invalid ID" + msgs.redirecting, verify: false });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//when the user clicks on reset password after entering new password
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

        if (id.match(/^[0-9a-fA-F]{24}$/)) {

            const user = await User.findById(id);

            if (!user)
                return res.status(400).json({ msg: "This account does not exist." });

            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(password, salt);
            const newToken = await nanoid(8);
            await User.findOneAndUpdate({ "email": user.email }, { $set: { "password": passwordHash, "passToken": newToken } });
            // sendEmail(user.email, templates.passwordResetDone());
            return res.status(200).json({ msg: "Password Reset Successful. You'll be redirected in 5 seconds..." });
        }
        return res.json({ msg: "User does not exist. Invalid ID" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//To confirm user's account of which the attribute is present in the schema of User
router.get("/email/confirm/:id", emailController.confirmUserEmail);


router.get("/order-history", async (req, res) => {
    const email = req.body.email;

    const user = await User.findOne({ email: email });

    if (!user)
        return res.status(400).json({ msg: "The account does not exist" });

    const order = await Payment.find({ userID: user._id });
    console.log(order);

    if (!order || order === [])
        return res.status(400).json({ msg: "No orders Placed yet!" });

    return res.status(200).json({ msg: "ok", order });
});

module.exports = router;