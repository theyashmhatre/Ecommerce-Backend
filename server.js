require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { urlencoded } = require("body-parser");
const PORT = process.env.PORT || 4000;
const { nanoid } = require("nanoid");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Different routes to keep APIs with different functionalities separated

app.use("/users", require("./routes/userRouter"));
app.use("/admin", require("./routes/adminRouter"));
app.use("/razorpay", require("./routes/razorpayRouter"));
app.use("/product", require("./routes/productRouter"));
app.use("/mis-report", require("./routes/MISreportRouter"));


//For running locally
app.listen(PORT, () => console.log(`The server has started on port: ${PORT}`));


mongoose.connect(
    process.env.MONGODB_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    },
    (err) => {
        if (err) throw err;
        console.log("MongoDB connection established");
    }
);