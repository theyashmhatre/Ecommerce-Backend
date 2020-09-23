const jwt = require("jsonwebtoken");

//Verify token's authenticity so as to keep user logged in

const auth = (req, res, next) => {
    try {
        const token = req.header("x-auth-token");
        if (!token)
            return res
                .status(401)
                .json({ msg: "No authentication Token, authorisation denied." });
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        if (!verified)
            return res
                .status(401)
                .json({ msg: "Token verification failed, authorisation denied." });

        req.user = verified.id;

        next();

    } catch (err) {
        res.status(500).json({ err: err.message });
    }
};

module.exports = auth;