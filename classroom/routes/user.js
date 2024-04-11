const express = require("express");
const router = express.Router();


//Index
router.get("/",(req, res)=>{
    res.send("GET for users");
});


//Show
router.get("/:id",(req, res)=>{
    res.send("GET for user id");
});


//Post
router.post("/",(req, res)=>{
    res.send("POST for users");
});


//Delete
router.delete("/:id",(req, res)=>{
    res.send("DELETE for user id");
});

module.exports = router;