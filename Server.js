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



// login - returns token if success
app.post('/login', (req, res) =>{
  Account.login(req.body['UserName'],req.body['UserPassword'])
  .then(answer => {console.log(answer); res.status(answer.code).send(answer.msg); })
  // .then(answer => res.status(answer.code).send(answer.msg))

  .catch(err => res.status(401).send("A REALLY unexpected error acured1"));
});











  // DButilsAzure.execQuery("SELECT UserPassword FROM Users WHERE UserName=\'"+req.body['UserName']+"\'")
//   userName=req.body['UserName'];
//   DButilsAzure.execQuery(`SELECT  UserPassword FROM Users WHERE UserName = '${userName}'`)
//   .then((response,err) =>{
//
//     if(response.length===0){
//     UserNotFound(res);
//   }
//     if(err){
//       res.status(401).send("An unexpected error acured");
//     }
//     realPass=response[0].UserPassword;
//
// console.log(realPass+"mmmmmm");
//     if(!realPass){
//       console.log(realPass+"mmmmmm");
//     UserNotFound(res);
//   }else if(realPass==req.body['UserPassword']){
//       //password is correct
//       //create and send tolke
//       payload = {id: tokenID++, username: req.body['UserName'], admin: false};
//       options = {expiresIn: "1d"};
//       const token = jwt.sign(payload, secret, options);
//       res.send(token);
//     }else {
//       invalidPassword(res);
// }
// }).catch(err => {
//   console.log("ENTERED CATCH\n"+err);
//   res.status(401).send("An unexpected error acured");
// });
// });

//
// function UserNotFound(res){
//   res.status(401).send("user does not exist");
//
// }
// function invalidPassword(res){
//   res.status(401).send("invalid password");
// }





app.post("/private", (req, res) =>{
  const token = req.header("x-auth-token");
  if(!token){
    res.status(401).send("Access Deny, no token provided");
  }

  try{
    const decoded = jwt.verify(token, secret);
    req.decoded = decoded;
    if(req.decoded.admin){
      res.status(200).send({result: 'Hello Admin'});
    }
    else{
      res.status(200).send({result: 'Hello User'});
    }
  }
  catch(Exception){
    res.status(400).send("yaniv: "+ Exception);
  }
});

app.get("/api/post/:year/:month",(req,res) => {
    // console.log();
    var ans = "the year is "+req.params["year"]+", the month is "+req.params["month"];
    ans +="<br> the max between the two is "+calc.max(req.params["year"],req.params["month"]);
  res.send(ans);

});

const port = process.env.PORT || 3000; //environment variable
app.listen(port, () => {
    console.log(`Listening on port ${port}`);

});
