const express = require ("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); // create more template
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");
const Review = require("./models/review.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");





app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });
    
async function main() {
    await mongoose.connect(MONGO_URL);
}

///// for session

const sessionOptions = {
  secret: "mysupersecretstring", 
  resave: false, 
  saveUninitialized: true,
  Cookie:{
    expires: Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly: true,
  }
  };




app.get("/",(req,res)=>{
    res.send("Hi, I am root");
});

const validateListing = (req,res,next) =>{
  let { error } = listingSchema.validate(req.body);
  
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
}

///////////////////////// Flashhhh megg show//////////

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);

app.use((req,res,next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/demouser", async(req,res) => {
  let fakeUser = new User({
    email:"student@gmail.com",
    username: "delta-student",
  });

  let registeredUser = await User.register(fakeUser,"helloworld"); //// fakeuser----> user , helloworld-----> password
  res.send(registeredUser);
});

//Index Route
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  });

//New Route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
  });


//Show Route
app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if(!listing){
      req.flash("error","Listing you requested for does not exist!");
      res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
  });

/////// Create route 
app.post(
  "/listings",
  validateListing,
wrapAsync(async(req,res) =>{


    const newListing = new Listing (req.body.listing) ;
    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
  
  
})
);

///Edit route
app.get("/listings/:id/edit",async(req,res)=>{
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error","Listing you requested for does not exist!");
      res.redirect("/listings");
    }
    res.render("listings/edit.ejs",{listing});
});

//Update Route
app.put("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success","Listing Updated!");

    res.redirect(`/listings/${id}`);
  });
  
  //Delete Route
  app.delete("/listings/:id", async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success"," Listing Deleted!");

    res.redirect("/listings");
  });

  /////Review Route
  //////Post Route

  app.post("/listings/:id/reviews", async (req,res) =>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success","New Review Created!");


    // console.log("new review saved");
    // res.send("new review saved");

    res.redirect(`/listings/${listing._id}`);

  });

  ////////////////Delete review Route

app.delete("/listings/:id/reviews/:reviewId", async(req,res) =>{
  let { id,reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
  await Review.findByIdAndDelete(reviewId);

  req.flash("success","Review Deleted!");

  res.redirect(`/listings/${id}`);
});


// app.get("/testListning",async(req,res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.all("*",(req,res,next) => {
  next(new ExpressError(404,"Page not found!"));
});

app.use((err,req,res,next) =>{
  let{statusCode = 500,message ="something went wrong"}= err;
  res.status(statusCode).render("error.ejs",{message});
  //res.status(statusCode).send(message);
  //res.send("something went wrong");
});

app.listen(8080, () =>{
    console.log("server is listening to port 8080");
});