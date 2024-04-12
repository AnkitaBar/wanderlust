const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");


router.get("/signup", (req, res)=>{
    res.render("users/signup.ejs");
});

router.post("/signup", async(req, res)=>{
    let {username, email, password} = req.body;
    const newUser = new User({email, username});
    const registeredUser= await User.register(newUser, password);
    console.log(registeredUser);
    req.flash("success", "Welcome to Wanderlust!");
    res.redirect("/listings");
});



//-----------FOR LOGIN PAGE-------------//
router.get("/login", (req,res)=>{
    res.render("users/login.ejs");
});

router.post(
    "/login", 
    passport.authenticate("local", {
        failureRedirect: "/login", 
        failureFlash: true,
    }),
    async(req, res)=>{
         req.flash("success", "Welcome back to Wanderlust!");
         res.redirect("/listings");
});

module.exports = router;