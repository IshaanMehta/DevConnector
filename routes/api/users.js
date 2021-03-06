const express = require("express");
const router = express.Router();
const {check, validationResult} = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

// @route POST api/users
// @desc  Test route
// access Public

const User = require("../../models/Users");

router.post("/", [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Enter a valid email").isEmail(),
    check("password", "Enter 6 or more charaters").isLength({
        min: 6
    })
] , async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return  res.status(400).json({errors : errors.array()});
    }

    const {name, email, password} = req.body;

    try{
         // See if user exists

        let user = await User.findOne({email});

        if(user){
           return res.status(400).json({errors : [{msg: "User already exists"}]});
        }

        // Get users gravatar

        const avatar = gravatar.url(email, {
            s : "200",
            r : "pg",
            d : "mm"
        })

        user = new User({
            name,
            email,
            password,
            avatar
        })

        // Encrypted passwords

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

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