const express = require("express");
const app = express();
const secret = 'ILikeToMoveItMoveIt';
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');
var tokenID=0;
app.use(express.json());
module.exports.login = login;
module.exports.verifyToken = verifyToken;
module.exports.register = register;


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

function createQnATable(userName,qa){
    tablename = userName + "_qna";
    return DButilsAzure.execQuery(`CREATE TABLEh ${tablename}(Question NVARCHAR(255) NOT NULL UNIQUE, Answer NVARCHAR(255) NOT NULL)`)
        .then(ans => {
            console.log("tabla added");
            return new Promise((resolve,reject) => resolve({ "code":200, "msg":"table has been added"}));
        })
        .catch(err => {
            throw err;
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
        .then(response => {createQnATable(credentials['UserName'], credentials['QNA'])})

}
