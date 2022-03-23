const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();

const userRoute = require("./routes/users")
const pinRoute = require("./routes/Pins")


dotenv.config();
app.use(express.json());

mongoose.connect(process.env.mongoURL)
.then(()=>{
    console.log("mongoDB connected xD");
})
.catch((err)=> console.log(err)); 


var cors = require('cors')
app.use(cors())

app.use("/api/pins", pinRoute);
app.use("/api/users", userRoute);


app.listen(8800,()=>{
    console.log("backend is running xD")
})