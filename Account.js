const express = require("express");
const app = express();
const secret = 'ILikeToMoveItMoveIt';
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');
var tokenID = 0;
app.use(express.json());
module.exports.login = login;
module.exports.verifyToken = verifyToken;
module.exports.register = testreg;
module.exports.token_verification = token_middleware;
module.exports.getUserQuestions = getUserQuestions;
module.exports.getPassword=getPassword;


function token_middleware(req, res, next) {
    const token = req.header("x-auth-token");

    if (!token) res.status(401).send("Access denied. No token provided");

    try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        next();
    } catch (exception) {
        res.status(400).send("Invalid token");
    }
}

function login(userName, password) {
    console.log("entered function!");
    return DButilsAzure.execQuery(`SELECT  UserPassword FROM Users WHERE UserName = '${userName}'`)
        .then(response => {
            if (response.length === 0) {
                return new Promise((resolve, reject) => resolve({"code": 400, "msg": "account does not exist"}));
            }
            realPass = response[0].UserPassword;
            if (!realPass) {
                return new Promise((resolve, reject) => resolve({"code": 400, "msg": "invalid password"}));
            }
            if (realPass == password) {
                //password is correct
                //create and send tolke
                payload = {id: tokenID++, username: userName, admin: false};
                options = {expiresIn: "1d"};
                const token = jwt.sign(payload, secret, options);
                console.log("print 1: returning message");
                return new Promise((resolve, reject) => resolve({"code": 201, "msg": token}));
            }
            return new Promise((resolve, reject) => resolve({"code": 400, "msg": "invalid password"}));
        })
}


function verifyToken(token) {

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, secret);
        console.log("decoded=" + decoded);
        return decoded;
    } catch (Exception) {
        console.log(Exception);
        return null;
    }
}


function validateReg(credentials) {
    if (!credentials)
        return false;
    try {
        if (!credentials['UserName'] || !credentials['UserPassword'] || !credentials['FirstName'] || !credentials['LastName'] ||
            !credentials['City'] || !credentials['Country'] || !credentials['Email'] || !credentials['Q&A'] || !credentials['Catagories'])
            return false;

        if (credentials['Q&A'].length < 2 || credentials['Catagories'].length < 2)
            return false;


        return true;

    } catch (Exception) {
        console.log("exception!!");
        return false;
    }
}


function addQnA(qnA, userName) {

    return new Promise((resolve, reject) => {

        try {

            qnA.forEach(function (atribute) {
                try {
                    DButilsAzure.execQuery(`INSERT INTO QNA VALUES ('${atribute.q}', '${atribute.a}', '${userName}')`)
                        .then((data) => {
                            console.log("added to q&a: Q:" + atribute.q + ", A:" + atribute.a + ", user:" + userName);
                            resolve("yey");
                        })
                        .catch((err) => {
                            console.log("yaniv 4");
                            reject(err);
                        });


                } catch (e) {
                    reject(e);
                }
            });


        } catch (e) {
            reject(e);
        }

    })
}


function regAddCategories(cat, userName) {
    return new Promise((resolve, rejectww) => {


        try {


            cat.forEach(function (atribute) {
                try {
                    console.log("************" + atribute);
                    DButilsAzure.execQuery(`INSERT INTO CategoriesByUsers VALUES ('${atribute}', '${userName}')`)
                        .then((data) => {
                            console.log("added to CategoriesByUser: cat:" + atribute + ", user:" + userName);
                            resolve("added categories");
                        })
                        .catch((err) => {
                            console.log("yaniv 6");

                            throw "data base error:\n" + err
                        });

                } catch (e) {
                    rejectww(e);
                }
            });

        } catch (Exception) {
            console.log("yaniv3");
            rejectww("ERROR2: did not add to CategoriesByUser")
        }

    })

}


function testreg(credentials) {
    return new Promise((resolve, reject) => {
            try {

                if (!validateReg(credentials)) {
                    reject({'code': 400, 'msg': err});
                }

                DButilsAzure.execQuery(`INSERT INTO  Users VALUES ('${credentials['UserName']}',
                    '${credentials['UserPassword']}','${credentials['FirstName']}','${credentials['LastName']}',
                    '${credentials['City']}','${credentials['Country']}','${credentials['Email']}')`)
                    .then(response => {
                            console.log("added user");
                            addQnA(credentials['Q&A'], credentials['UserName'])
                                .then(regAddCategories(credentials['Catagories'], credentials['UserName']))
                                .then(ans => {
                                    console.log("yaniv55");
                                    resolve({'code': 200, 'msg': "user was created"})
                                }).catch(err => {
                                console.log("should be fail add category");
                                reject(err)
                            })
                        }
                    ).catch(err => {
                    console.log("yaniv999");
                    reject({'code': 400, 'msg': err});
                })


            } catch
                (e) {
                reject({'code': 400, 'msg': "Exceptionerrpr:\n" + e});
            }
        }
    )
}

function getUserQuestions(userName) {
    return new Promise((resolve, reject) => {
        try {

            DButilsAzure.execQuery(`SELECT Question FROM QNA Where UserName='${userName}'`)
                .then(questions => {
                    resolve({'code': 200, 'msg': questions})
                })
                .catch(err => {
                    reject({'code': 400, 'msg': "ERROR1 getUserQuestions:\n" + err})
                })

        } catch (e) {
            reject({'code': 400, 'msg': "ERROR2 getUserQuestions:\n" + e})
        }


    })
}

function getPassword(userName,qna) {
    return new Promise((resolve, reject) => {
        try {
            if(!qna || !qna.Q || !qna.A)
                reject({'code': 400, 'msg': "bad credentials"});

            DButilsAzure.execQuery(`SELECT Answer FROM QNA Where UserName='${userName}' AND Question='${qna.Q}' `)
                .then(realAnswer => {
                    if(!realAnswer || realAnswer.length ==0){
                        reject({'code': 400, 'msg': "ERROR3 getPassword:\nno answer was founs for your question and username"})
                    }

                    if(realAnswer[0].Answer === qna.A){
                        console.log("return from DB: "+ realAnswer[0].Answer+"="+qna.A)
                        DButilsAzure.execQuery(`SELECT UserPassword FROM Users Where UserName='${userName}' `)
                            .then(password => {
                                resolve({'code': 200, 'msg':password[0]})
                            }).catch(err => {reject({'code': 400, 'msg': "ERROR1 getPassword(while retrieving password):\n"+err})})
                    }
                    else{ reject({'code': 400, 'msg': "ERROR1 getPassword:\nthe answer did not match the real answer"})}


                    }

                )
                .catch(err => { reject({'code': 400, 'msg': "ERROR1 getPassword:\n" + err})  })


        } catch (e) {
            reject({'code': 400, 'msg': "ERROR2 getPassword:\n" + e})
        }

    })
}