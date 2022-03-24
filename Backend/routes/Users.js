const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require('bcrypt');
const jwt = require ("jsonwebtoken");
var nodemailer = require('nodemailer');
var email = require("../routes/email");
require('dotenv').config();

// confirmation
router.get("/confirmation/:id",async (req,res)=>{
    const id = req.params.id
    User.findById(id).then((user)=>{
        user.active = 'active'
        user.save().then(()=>{
            res.send({message: 'activated'})
        }).catch((err)=>{
            res.send({message: err.message})
        })
    }).catch((err)=>{
        res.send({message: err.message})
    })

})

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

        //send mail
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.sendMail,
              pass: process.env.sendpass
            }
        });
        var url = `http://localhost:8800/api/users/confirmation/${newUser._id}`
        var mailverif = {
            from: process.env.sendMail,
            to: req.body.email,
            subject: 'Sending Email using Node.js',
            text: `please confirm: ${url}`
        };
          
        transporter.sendMail(mailverif, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
        });
        

        //save and send response
        const user = await newUser.save();
        res.status(200).json({user_id : user._id, url: url});

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