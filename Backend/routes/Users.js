const router = require("express").Router();
const User = require("../models/User");
const MID = require("./middleware ");
const bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
require('dotenv').config();

//confirmation/activate user
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
            subject: 'account activation',
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
        if (!user) return res.status(400).json("wrong user/pass")
        
        //validate password
        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password);
        if (!validPassword) return res.status(400).json("wrong user/pass")

        //check active
        if(user.active == "active"){

        //jwt authenticate
        const accessToken = MID.generateAccessToken(user);

        //send res
        return res.status(200).json({_id:user._id, username:user.username, accessToken: accessToken});
        }
        else return res.status(400).json("this user is not active")

    }catch(err){
        return res.status(500).json(err)   
    }
});

//edit profile
router.post("/editprofile/:id",async (req,res)=>{
    const id = req.params.id

    //generate the new password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(req.body.password,salt)

    //edit 
    User.findById(id).then((user)=>{
        user.username = req.body.username;
        user.email = req.body.email;
        user.password = hashedpassword;

        user.save().then(()=>{
            return res.send({message: 'edit success'})
        }).catch((err)=>{
            return res.send({message: err.message})
        })
    }).catch((err)=>{
        return res.send({message: err.message})
    })
})


//edit profile with a password check
router.post("/editprofilecheck/:id",async (req,res)=>{
    const id = req.params.id

    //generate the new password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(req.body.newpass,salt)

    //find user
    const userr = await User.findById(id);

    //check old password
    const checkPassword = await bcrypt.compare(
        req.body.password,
        userr.password);
    if (!checkPassword) return res.status(400).json("the old password is wrong !")

    //edit
    User.findById(id).then((user)=>{

        user.username = req.body.username;
        user.email = req.body.email;
        user.password = hashedpassword;

        user.save().then(()=>{
            return res.send({message: 'edit success'})
        }).catch((err)=>{
            return res.send({message: err.message})
        })
    }).catch((err)=>{
        return res.send({message: err.message})
    })
})

//delete profile
router.delete("/deleteprofile/:id",async (req,res)=>{
    const id = req.params.id
    User.findByIdAndDelete(id).then(()=>{
        return res.send({message: 'deleted'})
    }).catch((err)=>{
        return res.send({message: err.message})
    })
})

//reset password
router.post("/resetpass",async (req,res)=>{
    try{

        //find user
        var user = await User.findOne({$and:[{username:req.body.username},{email:req.body.email}]});
        if (!user) return res.status(400).json("wrong informations")

        //set new password
        var newpass = MID.randompass(6);
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(newpass,salt)
        user.password = hashedpassword;

        //send mail
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.sendMail,
              pass: process.env.sendpass
            }
        });

        var mailverif = {
            from: process.env.sendMail,
            to: req.body.email,
            subject: 'Password reset',
            text: `your new password is: ${newpass}`
        };
          
        transporter.sendMail(mailverif, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
        });

        //save and send res
        user.save().then(()=>{
            return res.status(200).send({message: `your new password is: ${newpass}`})})
    }catch(err){
        return res.status(500).json(err)   
    }
});

//get user list
router.get("/list", MID.authenticateToken, async (req,res)=>{
    User.find(function(err, users) {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.json(users);
        }
    });
});

//get user list
router.get("/list2", async (req,res)=>{
    User.find(function(err, users) {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.json(users);
        }
    });
});

//get user by id
router.get("/list/:id",async (req,res)=>{
    let id = req.params.id;
    User.findById(id, function(err, oneuser) {
        res.json(oneuser);
    });
});

//sherch user
router.get("/search",async (req,res)=>{
    const user = await User.findOne({username:req.body.username});
    if (!user) return res.status(400).json("there is no user by this name")

    res.status(200).json(user)
});

//filter user
router.get("/filter", (req,res)=>{
    User.find(function(err, users) {
        if (err) {
            return res.status(500).json(err);
        } else if (req.body.ok == "1"){
            return res.json(users.filter(e => e.active == "active"));
        } else if (req.body.ok == "2"){
            return res.json(users.filter(e => e.active == "inactive"));
        } else if (req.body.ok == "3"){
            return res.json(users.filter(e => e.node == "yes"));
        } else if (req.body.ok == "4"){
            return res.json(users.filter(e => e.node == "no"));
        }
    });
})

module.exports = router