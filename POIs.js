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
module.exports.set_favorites = set_favorites;
module.exports.post_review = add_review_to_POI;

function get_POI_info(POI_ID) {
    return DButilsAzure.execQuery(`SELECT * FROM POIs WHERE ID='${POI_ID}'`)
        .then(response => {
                try {
                    if (response.length === 0) {
                        return new Promise((resolve, reject) => resolve({'code': 400, 'msg': 'POI does not exist'}));
                    }
                    let ans = {
                        'views_amount': response[0].Views, 'description': response[0]._Description,
                        'rating': response[0].Rank, 'id': response[0].ID, 'name': response[0]._Name
                    };
                    return new Promise((resolve, reject) => resolve({'code': 200, 'msg': ans}));
                } catch (e) {
                    return new Promise((resolve, reject) => reject({'code': 400, 'msg': e}));
                }
            }
        ).catch(err => {
            return new Promise((resolve, reject) => reject({'code': 400, 'msg': err}))
        });
}

function get_top_POI_reviews(POI_ID, reviews_number) {
    console.log("n get top poi reviews");
    return DButilsAzure.execQuery(`SELECT TOP ${reviews_number} * FROM Reviews WHERE POI_ID='${POI_ID}' ORDER BY _Date DESC`)
        .then(response => {
            try {
                if (response.length === 0) {
                    return new Promise((resolve, reject) => reject({'code': 400, 'msg': 'POI does not exist'}));
                }
                let ans = [];
                for (let i = 0; i < reviews_number; i++) {
                    let rev = {
                        'ID': response[i].ID, 'POI_ID': response[i].POI_ID, 'UserName': response[i].UserName,
                        'Content': response[i].CONTENT, 'Raiting': response[i].Raiting, 'Date': response[i]._Date
                    };
                    ans.push(rev);
                }
                return new Promise((resolve, reject) => resolve({'code': 200, 'msg': ans}));
            } catch (e) {
                return new Promise((resolve, reject) => reject({'code': 400, 'msg': e}));
            }
        }).catch(err => {
            return new Promise((resolve, reject) => reject({'code': 400, 'msg': err}))
        });
}

function get_countries() {
    return DButilsAzure.execQuery(`SELECT _Name FROM Countries`)
        .then(response => {
            try {
                let ans = [];
                for (let i = 0; i < response.length; i++) {
                    ans.push(response[i]._Name);
                }
                return new Promise((resolve, reject) => resolve({'code': 200, 'msg': ans}));
            } catch (e) {
                return new Promise((resolve, reject) => reject({'code': 400, 'msg': e}));
            }
        }).catch(err => {
            return new Promise((resolve, reject) => reject({'code': 400, 'msg': err}))
        });
}

function get_POIs_By_Category(Category) {
    return DButilsAzure.execQuery(`SELECT * FROM POIs WHERE ID IN (SELECT POI_ID FROM POIsByCategories WHERE Category='${Category}')`)
        .then(response => {
            try {
                if (response.length === 0) {
                    return new Promise((resolve, reject) => reject({'code': 400, 'msg': 'Category has no POIs'}));
                }
                let ans = [];
                for (let i = 0; i < response.length; i++) {
                    let poi = {
                        'views_amount': response[i].Views, 'description': response[i]._Description,
                        'rating': response[i].Rank, 'id': response[i].ID, 'name': response[i]._Name
                    };
                    ans.push(poi);
                }
                return new Promise((resolve, reject) => resolve({'code': 200, 'msg': ans}));
            } catch (e) {
                return new Promise((resolve, reject) => reject({'code': 400, 'msg': e}));
            }
        }).catch(err => {
            return new Promise((resolve, reject) => reject({'code': 400, 'msg': err.message}));
        });
}

function get_POIs(min_rating) {
    return DButilsAzure.execQuery(`SELECTI * FROM POIs WHERE Rank >= ${min_rating}`)
        .then(response => {
            try {
                if (response.length === 0) {
                    return new Promise((resolve, reject) => reject({
                        'code': 400,
                        'msg': 'No POIs found gte ' + min_rating
                    }));
                }
                let ans = [];
                for (let i = 0; i < response.length; i++) {
                    let poi = {
                        'views_amount': response[i].Views, 'description': response[i]._Description,
                        'rating': response[i].Rank, 'id': response[i].ID, 'name': response[i]._Name
                    };
                    ans.push(poi);
                }
                return new Promise((resolve, reject) => resolve({'code': 200, 'msg': ans}));
            } catch (e) {
                return new Promise((resolve, reject) => reject({'code': 400, 'msg': e}));
            }
        }).catch(err => {
            return new Promise((resolve, reject) => reject({'code': 400, 'msg': err.message}));
        });
}

function get_favorites(UserName) {
    return DButilsAzure.execQuery(`SELECT * FROM POIs WHERE ID IN (SELECT POI_ID FROM FavoritePOIs WHERE UserName='${UserName}')`)
        .then(response => {
            try {
                let ans = [];
                for (let i = 0; i < response.length; i++) {
                    let poi = {
                        'views_amount': response[i].Views, 'description': response[i]._Description,
                        'rating': response[i].Rank, 'id': response[i].ID, 'name': response[i]._Name
                    };
                    ans.push(poi);
                }
                return new Promise((resolve, reject) => resolve({'code': 200, 'msg': ans}));
            } catch (e) {
                return new Promise((resolve, reject) => reject({'code': 400, 'msg': e}));
            }
        }).catch(err => {
            return new Promise((resolve, reject) => reject({'code': 400, 'msg': err.message}));
        });
}

function set_favorites(UserName, favorites) {
    return new Promise((resolve, reject) => {
        try{
            DButilsAzure.execQuery(`DELETE FROM FavoritePOIs WHERE UserName='${UserName}'`)
                .then(response => {
                    let query = "INSERT INTO FavoritePOIs VALUES";
                    favorites.forEach(poi => {
                        query += ("('"+poi+"', '"+UserName+"'),");
                    });
                    query = query.substring(0, query.length-1);
                    DButilsAzure.execQuery(`${query}`)
                        .then(response => {
                            resolve({'code':200, 'msg':'Favorite POIs set Successfully'});
                        })
                        .catch(err => reject({'code':400, 'msg':err.message}))
                })
                .catch(err => reject({'code':400, 'msg':err.message}))
        }catch (e) {
            reject({'code':400, 'msg':e});
        }
    })
}

function add_review_to_POI(UserName, POI_ID, review){
    return new Promise((resolve, reject) => {
        try{
            if (!POI_ID){
                reject({'code':400, 'msg':'Must have poi_id'})
            }
            if (!review || !review.rating){
                reject({'code':400, 'msg':'Must have rating'});
            }
            if (!review.content){
                review.content = '';
            }
            DButilsAzure.execQuery(`INSERT INTO Reviews VALUES('${POI_ID}', '${UserName}', '${review.content}', ${review.rating}, GETDATE())`)
                .then(response => resolve({'code':201, 'msg':'review has been added'}))
                .catch(err => reject({'code':400, 'msg':err.message}))
        }catch (e) {
            reject({'code':400, 'msg':e});
        }
    })
}
