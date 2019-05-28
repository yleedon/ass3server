const express = require("express");
const app = express();
const secret = 'ILikeToMoveItMoveIt';
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');
var tokenID = 0;
app.use(express.json());
module.exports.login = login;
module.exports.verifyToken = verifyToken;
module.exports.register = register();
module.exports.token_verification = token_middleware;
module.exports.getUserQuestions = getUserQuestions;
module.exports.getPassword = getPassword;


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
            !credentials['City'] || !credentials['Country'] || !credentials['Email'] || !credentials['Q&A'] || !credentials['Categories'])
            return false;

        if (credentials['Q&A'].length < 2 || credentials['Categories'].length < 2)
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

            let query = "INSERT INTO QNA VALUES";
            qnA.forEach(function (atribute) {
                try {
                    if(!atribute.q || !atribute.a)
                        throw("bad arguments! mast have q:question, a:answer");
                    query = query + "('" + atribute.q + "', '" + atribute.a + "', '" + userName + "'),";
                    console.log("added to q&a: Q:" + atribute.q + ", A:" + atribute.a + ", user:" + userName);
                }catch(e){
                    throw(e);
                }
            });

            query = query.substring(0, query.length - 1);

            DButilsAzure.execQuery(`${query}`)
                .then(respons => {

                    resolve({'code': 201, 'msg': "QNA has been added"});
                })
                .catch(err => {
                    reject({ "code":400 , "msg":err.message})
                })


        } catch (e) {
            reject({ "code":400 , "msg":e})
        }
    })}

function regAddCategories(cat, userName) {
    return new Promise((resolve, reject) => {
        // reject({'code':201, 'msg':'category failure'});


            try {
                let query = "INSERT INTO CategoriesByUsers VALUES";
                cat.forEach(function (atribute) {
                    query = query + "('" + atribute + "', '"+ userName +"'),"
                });
                query = query.substring(0, query.length - 1);
                DButilsAzure.execQuery(`${query}`)
                    .then(response => {
                        resolve({'code': 201, 'msg': 'Categories has been added'});
                    })
                    .catch(err => {
                        reject({'code': 400, 'msg': err.message})
                    });

            }catch(e){
                reject({'code': 400, 'msg': e})
            }
    })}

function register(credentials) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!validateReg(credentials)) {
               throw("bas credentials given");
            }
            let newUserCreated = false;
            await DButilsAzure.execQuery(`INSERT INTO  Users VALUES ('${credentials['UserName']}',
                    '${credentials['UserPassword']}','${credentials['FirstName']}','${credentials['LastName']}',
                    '${credentials['City']}','${credentials['Country']}','${credentials['Email']}')`)
                .then(async response => {
                    newUserCreated = true;
                    await addQnA(credentials['Q&A'], credentials['UserName'])
                        .then(async response => {
                            await regAddCategories(credentials['Categories'], credentials['UserName'])
                                .then(response => {
                                    resolve({'code': 201, 'msg': 'user was added'});
                                })
                                .catch(async err =>{
                                    await DButilsAzure.execQuery(`DELETE FROM Users WHERE UserName='${credentials['UserName']}'`);
                                    reject({'code': err.code, 'msg': err.msg})}
                                )
                        })
                        .catch(async err => {
                            await DButilsAzure.execQuery(`DELETE FROM Users WHERE UserName='${credentials['UserName']}'`);
                            reject({'code': err.code, 'msg': err.msg})})
                }).catch(async err => {
                    console.log("qwqwqwqwwwqwqwqwqwqwqwqwqw")

                    reject({'code':400, 'msg':err.message});
                });
        } catch (e) {
            reject({'code':400, 'msg': e})
        }
    });

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

function getPassword(userName, qna) {
    return new Promise((resolve, reject) => {
        try {
            if (!qna || !qna.Q || !qna.A)
                reject({'code': 400, 'msg': "bad credentials"});

            DButilsAzure.execQuery(`SELECT Answer FROM QNA Where UserName='${userName}' AND Question='${qna.Q}' `)
                .then(realAnswer => {
                        if (!realAnswer || realAnswer.length == 0) {
                            reject({
                                'code': 400,
                                'msg': "ERROR3 getPassword:\nno answer was founs for your question and username"
                            })
                        }

                        if (realAnswer[0].Answer === qna.A) {
                            console.log("return from DB: " + realAnswer[0].Answer + "=" + qna.A)
                            DButilsAzure.execQuery(`SELECT UserPassword FROM Users Where UserName='${userName}' `)
                                .then(password => {
                                    resolve({'code': 200, 'msg': password[0]})
                                }).catch(err => {
                                reject({'code': 400, 'msg': "ERROR1 getPassword(while retrieving password):\n" + err})
                            })
                        } else {
                            reject({'code': 400, 'msg': "ERROR1 getPassword:\nthe answer did not match the real answer"})
                        }


                    }
                )
                .catch(err => {
                    reject({'code': 400, 'msg': "ERROR1 getPassword:\n" + err})
                })


        } catch (e) {
            reject({'code': 400, 'msg': "ERROR2 getPassword:\n" + e})
        }

    })
}