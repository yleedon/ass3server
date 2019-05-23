const express = require("express");
const app = express();
const secret = 'ILikeToMoveItMoveIt';
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');
var tokenID=0;
app.use(express.json());
module.exports.login = login;
module.exports.verifyToken = verifyToken;
module.exports.register = danreg;
module.exports.token_verification = token_middleware;


function token_middleware(req, res, next){
    const token = req.header("x-auth-token");

    if(!token) res.status(401).send("Access denied. No token provided");

    try{
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        next();
    }
    catch (exception) {
        res.status(400).send("Invalid token");
    }
}

function login(userName,password){
console.log("entered function!");
  return DButilsAzure.execQuery(`SELECT  UserPassword FROM Users WHERE UserName = '${userName}'`)
  .then(response =>{
    if(response.length===0){
      return new Promise((resolve,reject) => resolve({ "code":400, "msg":"account does not exist"}));
    }
    realPass=response[0].UserPassword;
    if(!realPass){
      return new Promise((resolve,reject) => resolve({ "code":400, "msg":"invalid password"}));
    }
    if(realPass==password){
        //password is correct
        //create and send tolke
        payload = {id: tokenID++, username: userName, admin: false};
        options = {expiresIn: "1d"};
        const token = jwt.sign(payload, secret, options);
        console.log("print 1: returning message");
        return new Promise((resolve,reject) => resolve({ "code":201, "msg":token }));
    }
    return new Promise((resolve,reject) => resolve({ "code":400, "msg":"invalid password" }));
  })
}


function verifyToken(token){

    if(!token){
        return null;
    }

    try{
        const decoded = jwt.verify(token, secret);
        console.log("decoded="+decoded);
        return decoded;
    }
    catch(Exception){
        console.log(Exception);
        return null;
    }
}



//
// function register(credentials){
//
//
//     if(!validateReg(credentials))
//         return new Promise((resolve,reject) => reject({ "code":400, "msg":"bad credentials" }));
//
//
//     var promise = DButilsAzure.execQuery(`INSERT INTO  Users VALUES ('${credentials['UserName']}','${credentials['UserPassword']}','${credentials['FirstName']}','${credentials['LastName']}','${credentials['City']}','${credentials['Country']}','${credentials['Email']}')`);
//     return promise
//         .then(ans => {return new Promise((resolve,reject) => resolve({ "code":200, "msg":"user was created\n"+ans }))})
//         .catch(err => {return new Promise((resolve,reject) => reject({ "code":400, "msg":"dataBase error:\n"+ err }));})
//
//
//     return promise;
//
//
// }
//

function register(credentials){


    if(!validateReg(credentials))
        return new Promise((resolve,reject) => reject({ "code":400, "msg":"bad credentials" }));



    var promise = DButilsAzure.execQuery(`INSERT INTO  Users VALUES ('${credentials['UserName']}','${credentials['UserPassword']}','${credentials['FirstName']}','${credentials['LastName']}','${credentials['City']}','${credentials['Country']}','${credentials['Email']}')`);
    return promise
        .then(createQnATable(credentials['UserName'],credentials['Q&A']))
        .then( res => {console.log("111"); return new Promise((resolve,reject) => resolve({ "code":200, "msg":"*************"+res }))})
        .catch(err => {console.log("222");return new Promise((resolve,reject) => reject({ "code":400, "msg":"dataBase error:\n"+ err }));})



}

async function createQnATable(userName,qa){
    tablename = userName + "_qna";
    return DButilsAzure.execQuery(`CREATE TABLEh ${tablename}(Question NVARCHAR(255) NOT NULL UNIQUE, Answer NVARCHAR(255) NOT NULL)`)
        .then(ans => {
            console.log("tabla added");
            return new Promise((resolve,reject) => resolve({ "code":200, "msg":"table has been added"}));
        })
        .catch(err => {
            return new Promise((resolve, reject) => reject({'code':400, 'msg':"yaniv2"+err}));
        });


}



function validateReg(credentials){
    if(!credentials)
        return false;
    try {
        if (!credentials['UserName'] || !credentials['UserPassword'] || !credentials['FirstName'] || !credentials['LastName'] ||
            !credentials['City'] || !credentials['Country'] || !credentials['Email'] || !credentials['Q&A'] || !credentials['Catagories'])
            return false;

        if(credentials['Q&A'].length < 2 || credentials['Catagories'].length < 2)
            return false;



        return true;

    }catch(Exception){ console.log("exception!!"); return false;}
}

async function danreg(credentials){
    if (!validateReg(credentials)){
        return new Promise((resolve, reject) => reject({'code':400, 'msg':'unauthorized credentials'}));
    }



    return DButilsAzure.execQuery(`INSERT INTO  Users VALUES ('${credentials['UserName']}',
      '${credentials['UserPassword']}','${credentials['FirstName']}','${credentials['LastName']}',
      '${credentials['City']}','${credentials['Country']}','${credentials['Email']}')`)
        .then(async response =>{
            try {

                await addQnA(credentials['Q&A'], credentials['UserName']);
                await regAddCategories(credentials['Catagories'], credentials['UserName']);


            return new Promise((resolve, reject) => resolve({'code':200, 'msg':credentials['UserName']+" was added to Users"}));

            }catch(Exception){
                console.log("yaniv 5");
                return new Promise((resolve, reject) => reject({'code':400, 'msg':err}));
            }

        })
        .catch(err => {
            console.log("yaniv 5");
            return new Promise((resolve, reject) => reject({'code':400, 'msg':err}))});
}

async function addQnA(qnA,userName){

    try {
        // console.log("test1: "+ qnA[0].q); '${userName}'

        qnA.forEach(function (atribute) {
            DButilsAzure.execQuery(`INSERT INTO QNA VALUES ('${atribute.q}', '${atribute.a}', '${userName}')`)
                .then((data)=> console.log("added to q&a: Q:"+atribute.q+", A:"+atribute.a+", user:"+ userName))
                .catch ((err)=> {
                    console.log("yaniv 4");
                    throw "ERROR: did not add Q&A";
                });

        });

    }catch(Exception){
        console.log("yaniv3");
        throw "ERROR: did not add Q&A";
    }
}

async function regAddCategories(cat,userName){
    try {


        cat.forEach(function (atribute) {
            DButilsAzure.execQuery(`INSERT INTO CategoriesByUser VALUES ('${atribute}', '${userName}')`)
                .then((data)=> console.log("added to CategoriesByUser: cat:"+atribute+", user:"+ userName))
                .catch ((err)=> {
                    console.log("yaniv 6");
                    return new Promise((resolve, reject) => reject( "ERROR1: did not add cat to CategoriesByUser: "+atribute));
                });

        });

    }catch(Exception){
        console.log("yaniv3");
        throw "ERROR2: did not add to CategoriesByUser";
    }
}