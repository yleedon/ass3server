const express = require("express");
const app = express();
const secret = 'ILikeToMoveItMoveIt';
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');
var tokenID=0;
app.use(express.json());
module.exports.login = login;


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
