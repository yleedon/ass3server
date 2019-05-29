const express = require("express");
const app = express();
const Account = require("./Account");
const secret = 'ILikeToMoveItMoveIt';
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');
const POIs = require('./POIs');
app.use(express.json());
app.use('/validate', Account.token_verification);

// console.log("server startedd!");


//get password - given a correct user, question and answer, returns the users pasword
app.post('/getPassword', (req, res) =>{
    Account.getPassword(req.body['username'],req.body['QNA'])
        .then(answer => {console.log(answer); res.status(answer.code).send(answer.msg); })
        .catch(err => res.status(401).send(err.msg));
});

// get QNA - given a correct user name, will return all of his verification questions.
app.get('/getQNA', (req, res) =>{
    console.log(req.body['username']);
    Account.getUserQuestions(req.body['username'])
        .then(answer => {console.log(answer); res.status(answer.code).send(answer.msg); })
        .catch(err => res.status(401).send(err.msg));
});

// login - returns token if success
app.post('/login', (req, res) =>{
    Account.login(req.body['UserName'],req.body['UserPassword'])
        .then(answer => {console.log(answer); res.status(answer.code).send(answer.msg); })
        .catch(err => res.status(401).send("A REALLY unexpected error"));
});

// register
app.post("/register", (req, res) =>{
    Account.register(req.body)
    .then(answer => {
        res.status(answer.code).send(answer.msg);
    })
    .catch(err => {
        res.status(err.code).send(err.msg);
    });

});

//get Poi info
app.get('/get_POI_info', (req, res) =>{
    POIs.get_POI_info(req.body['poi_id'])
        .then(ans => {
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

app.put('/add_view_to_POI', (req, res) =>{
    POIs.add_view_to_POI(req.body['poi_id'])
        .then(ans =>{
            res.status(ans.code).send(ans.msg)
        })
        .catch(err => res.status(err.code).send(edd.msg));
});

//get POI reviews
app.get('/get_POI_reviews', (req, res) =>{
    POIs.get_top_POI_reviews(req.body['poi_id'], req.body['reviews_number'])
        .then(ans => {
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

//get countries
app.get('/get_countries', (req, res) =>{
    POIs.get_countries()
        .then(ans =>{
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

//get pois by category
app.get('/get_POIs_By_Category', (req, res) =>{
    POIs.get_POIs_By_Category(req.body['category'])
        .then(ans=>{
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

//get pois
    app.get('/get_POIs', (req, res) =>{
    POIs.get_POIs(req.body['min_rating'])
        .then(ans =>{
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

//get favorites
app.get('/validate/get_favorites', (req, res) => {
    POIs.get_favorites(req.decoded['username'])
        .then(ans => {
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

//set favorites
app.put('/validate/set_favorites', (req, res) => {
    POIs.set_favorites(req.decoded['username'], req.body['favorites'])
        .then(ans =>{
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

app.post('/validate/post_review', (req, res) => {
    POIs.post_review(req.decoded['username'], req.body['poi_id'], req.body['review'])
        .then(ans =>{
            res.status(ans.code).send(ans.msg);
        })
        .catch(err => res.status(err.code).send(err.msg));
});

app.get('/validate/get_user_categories', (req, res) => {
    POIs.get_user_categories(req.decoded['username'])
        .then(ans => {
            res.status(ans.code).send(ans.msg)
        })
        .catch(err => res.status(err.code).send(err.msg))
});

const port = process.env.PORT || 3000; //environment variable
app.listen(port, () => {
    console.log(`Listening on port ${port}`);

});

