const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require ("jsonwebtoken");
require('dotenv').config();


//register
router.post("/register",async (req,res)=>{
    try{

        //generate password
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(req.body.password,salt)

        //create user 
        const newUser = new User({
            username:req.body.username,
            email:req.body.email,
            password:hashedpassword,
        })

        //save and send response
        const user = await newUser.save();
        res.status(200).json(user._id);

    }catch(err){
        res.status(500).json(err)
    }
});

//login
router.post("/login",async (req,res)=>{
    try{

        //find user
        const user = await User.findOne({username:req.body.username});
        !user && res.status(400).json("wrong user/pass")
        
        //validate password
        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password);
        !validPassword && res.status(400).json("wrong user/pass")

        //jwt authenticate
        const accessToken = jwt.sign(user.username, process.env.Access_ts);

        //send res
        res.status(200).json({_id:user._id, username:user.username, accessToken: accessToken});

    }catch(err){
        res.status(500).json(err)   
    }
});


module.exports = router