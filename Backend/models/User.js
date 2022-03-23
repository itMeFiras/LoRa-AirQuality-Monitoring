const mongoose = require("mongoose");
const { required } = require("nodemon/lib/config");

const UserSchema = new mongoose.Schema({
    username: {
        type:String,
        required:true,
        min:3,
        max:20,
        unique:true,
    },
    email: {
        type:String,
        required:true,
        max:30,
        unique:true,
    },
    password: {
        type:String,
        required:true,
        min:6,
    },
},{timestamps: true});

module.exports = mongoose.model("User",UserSchema); 