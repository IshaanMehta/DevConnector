const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const config = require("config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {check, validationResult} = require("express-validator");

// @route GET api/auth
// @desc  Test route
// access Public

router.get("/", auth, async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    }
    catch(err){
        res.status(500).send("Server Error");
    }
});

// @route POST api/auth
// @desc  Authenticate user and get token
// access Public

const User = require("../../models/Users");

router.post("/", [
    check("email", "Enter a valid email").isEmail(),
    check("password", "Password is required").exists()
] , async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return  res.status(400).json({errors : errors.array()});
    }

    const {email, password} = req.body;

    try{
         // See if there is not a user and if not then send an error

        let user = await User.findOne({email});

        if(!user){
           return res.status(400).json({errors : [{msg: "Invalid Credentials"}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({errors : [{msg: "Invalid Credentials"}]});
        }
        
        // Return jsonwebtoken

        const payload = {
            user : {
                id : user.id
            }
        }

        jwt.sign(payload,
                config.get("jwtToken"),
                {expiresIn : 36000},
                (err, token) => {
                    if(err) throw err;
                    res.json({token});
                }
            )

        
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("Server error");
    }
   
});

module.exports = router;