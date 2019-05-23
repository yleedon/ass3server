const express = require("express");
const app = express();
var jwt = require('jsonwebtoken');
const DButilsAzure = require('./DButils');

app.use(express.json());
module.exports.get_POI_info = get_POI_info;
module.exports.get_top_POI_reviews = get_top_POI_reviews;
module.exports.get_countries = get_countries;
module.exports.get_POIs_By_Category = get_POIs_By_Category;
module.exports.get_POIs = get_POIs;
module.exports.get_favorites = get_favorites;

async function get_POI_info(POI_ID){
    console.log("get poi info");
    return DButilsAzure.execQuery(`SELECT * FROM POIs WHERE ID='${POI_ID}'`)
        .then(response => {
            if (response.length === 0){
                return new Promise(((resolve, reject) => resolve({'code':400, 'msg':'POI does not exist'})));
            }
            let ans = {'views_amount':response[0].Views, 'description':response[0]._Description,
                'rating':response[0].Rank, 'id':response[0].ID, 'name':response[0]._Name};
            return new Promise((resolve, reject) => resolve({'code':200, 'msg':ans}));
        })
        .catch(err => {return new Promise(((resolve, reject) => resolve({'code':400, 'msg':'get_POI_info:\n'+err})))});
}

async function get_top_POI_reviews(POI_ID, reviews_number) {
    console.log("get top poi reviews");
    return DButilsAzure.execQuery(`SELECT TOP ${reviews_number} * FROM Reviews WHERE POI_ID='${POI_ID}'`)
        .then(response => {
            if (response.length === 0){
                return new Promise(((resolve, reject) => resolve({'code':400, 'msg':'POI does not exist'})));
            }
            let ans = [];
            for (let i=0; i<reviews_number; i++){
                let rev = {'ID':response[i].ID, 'POI_ID':response[i].POI_ID, 'UserName':response[i].UserName,
                    'Content':response[i].CONTENT, 'Raiting':response[i].Raiting, 'Date':response[i]._Date};
                ans.push(rev);
            }
            return new Promise(((resolve, reject) => resolve({'code':200, 'msg':ans})));
        })
        .catch(err => {return new Promise(((resolve, reject) => resolve({'code':400, 'msg':'get_top_POI_reviews:\n'+err})))});
}

async function get_countries() {
    console.log("get countries");
    return DButilsAzure.execQuery(`SELECT _Name FROM Countries`)
        .then(response => {
            let ans = [];
            for (let i=0; i<response.length; i++){
                ans.push(response[i]._Name);
            }
            return new Promise(((resolve, reject) => resolve({'code':200, 'msg':ans})));
        })
        .catch(err => {return new Promise((resolve, reject) => resolve({'code':400, 'msg':'get_countries:\n'+err}))});
}

async function get_POIs_By_Category(Category) {
    console.log("get pois by category");
    return DButilsAzure.execQuery(`SELECT * FROM POIs Where ID IN (SELECT POI_ID FROM POIsByCategories WHERE Category='${Category}')`)
        .then(response => {
            if (response.length===0){
                return new Promise((resolve, reject) => resolve({'code':400, 'msg':'Category has no POIs'}));
            }
            let ans = [];
            for (let i=0; i<response.length; i++){
                let poi = {'views_amount':response[i].Views, 'description':response[i]._Description,
                    'rating':response[i].Rank, 'id':response[i].ID, 'name':response[i]._Name};
                ans.push(poi);
            }
            return new Promise(((resolve, reject) => resolve({'code':200, 'msg':ans})));
        })
        .catch(err => {return new Promise(((resolve, reject) => resolve({'code':400, 'msg':'get_POIs_By_Category:\n'+err})))});
}

async function get_POIs(min_rating) {
    console.log("get pois");
    return DButilsAzure.execQuery(`SELECT * FROM POIs WHERE Rank >= ${min_rating}`)
        .then(response => {
            if (response.length === 0){
                return new Promise((resolve, reject) => resolve({'code':400, 'msg':'No POIs found'}));
            }
            let ans = [];
            for (let i=0; i<response.length; i++){
                let poi = {'views_amount':response[i].Views, 'description':response[i]._Description,
                    'rating':response[i].Rank, 'id':response[i].ID, 'name':response[i]._Name};
                ans.push(poi);
            }
            return new Promise((resolve, reject) => resolve({'code':200, 'msg':ans}));
        })
        .catch(err => {return new Promise((resolve, reject) => resolve({'code':400, 'msg':'get_POIs:\n'+err}))});
}

async function get_favorites(UserName) {
    console.log("get favorites");
    return DButilsAzure.execQuery(`SELECT * FROM POIs WHERE ID IN (SELECT POI_ID FROM FavoritePOIs WHERE UserName='${UserName}') `)
        .then(response => {
            let ans = [];
            for (let i=0; i<response.length; i++){
                let poi = {'views_amount':response[i].Views, 'description':response[i]._Description,
                    'rating':response[i].Rank, 'id':response[i].ID, 'name':response[i]._Name};
                ans.push(poi);
            }
            return new Promise((resolve, reject) => resolve({'code':200, 'msg':ans}));
        })
        .catch(err => {return new Promise((resolve, reject) => resolve({'code':400, 'msg':'get_favorites:\n'+err}))});
}