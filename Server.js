const express = require("express");
const app = express();
const Account = require("./Account");
const secret = 'ILikeToMoveItMoveIt';
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');
app.use(express.json());


console.log("server started!");

//welcome screen
app.get("/", (req, res) => {
    res.status(200).send("welcome to the main page");
    console.log("GET Request Requested!");
});

//get all users
app.get('/select', function(req, res){
    DButilsAzure.execQuery("SELECT * FROM Users")
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log(err)
        res.send(err)
    })
});

// app.post('/ddd/yyy', (req, res) =>{
//   DButilsAzure.execQuery("INSERT INTO Test (UserName, UserDescription) VALUES('ddd', 'HIHIHI')")
//   .then(d => console.log("WEEEEE"))
//   .catch(e => console.log(e));
//   res.status(201).send("yaniv")
// });

//test for our token
app.post("/testprivate", (req, res) =>{
    try {
        const token = req.header("x-auth-token");
        if(!token){
            res.status(401).send("Access Deny, no token provided");
        }

        var ans = Account.verifyToken(token);
        if(ans.admin)
        res.status(200).send("helo admin user");
        else res.status(200).send("helo user");

        // res.status(ans.code).send(ans.msg);

    }catch(Exeption){
        res.status(200).send("invalid token");
        console.log("entered exception");
    }

});











// login - returns token if success
app.post('/login', (req, res) =>{
    Account.login(req.body['UserName'],req.body['UserPassword'])
        .then(answer => {console.log(answer); res.status(answer.code).send(answer.msg); })
        .catch(err => res.status(401).send("A REALLY unexpected error acured1"));
});


app.post("/register", (req, res) =>{
    Account.register(req.body)
    .then(answer => {
        console.log("register")
        res.status(answer.code).send(answer.msg);
    })
    .catch(err => {
        console.log("catch registration");
        res.status(err.code).send(err.msg+"end catch");
    });

});



// app.get("/api/post/:year/:month",(req,res) => {
//     // console.log();
//     var ans = "the year is "+req.params["year"]+", the month is "+req.params["month"];
//     ans +="<br> the max between the two is "+calc.max(req.params["year"],req.params["month"]);
//   res.send(ans);
//
// });

/**********DAN*************/
//get Poi info
app.get('/get_POI_info', (req, res) =>{
    POIs.get_POI_info(req.body['poi_id'])
        .then(ans => {
            console.log(ans);
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(400).send("get POI info problem:\n"+err));
});

//get POI reviews
app.get('/get_POI_reviews', (req, res) =>{
    POIs.get_top_POI_reviews(req.body['poi_id'], req.body['reviews_number'])
        .then(ans => {
            console.log(ans);
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(400).send("get POI reviews problem:\n"+err));
});

app.get('/get_countries', (req, res) =>{
    POIs.get_countries()
        .then(ans =>{
            console.log(ans);
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(400).send("get countries problem:\n"+err));
});

app.get('/get_POIs_By_Category', (req, res) =>{
    POIs.get_POIs_By_Category(req.body['category'])
        .then(ans=>{
            console.log(ans);
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(400).send("get pois by category"));
});

app.get('/get_POIs', (req, res) =>{
    POIs.get_POIs(req.body['min_rank'])
        .then(ans =>{
            console.log(ans);
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(400).send("get pois"));
});

/**********DAN*************/

const port = process.env.PORT || 3000; //environment variable
app.listen(port, () => {
    console.log(`Listening on port ${port}`);

});

