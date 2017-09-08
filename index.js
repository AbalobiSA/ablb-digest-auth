let http = require('http');
let https = require('https');
let md5 = require('md5');
let fs = require('fs');
let request = require('request');

/*==============================================================================
    HTTP Requests - The real point of this whole script.
==============================================================================*/

function wrapper(options, username, password) {
    return new Promise((resolve, reject) => {

        let host = getHost(options.url);
        let path = getPath(options.url);

        options.headers.host = host;
        options.headers.path = path;

        // console.log(options);
        console.log("Attempting request");

        request(options, (err, response, body) => {
            if (err) {
                reject(err);
                return;
            }

            if (response.statusCode === 401) {
                console.log("Request requires digest auth. Processing...");
                // console.log(response.headers);

                let arguments = {
                    username: username,
                    password: password,
                    options: options,
                    response: response,
                    body: body
                };

                buildDigestRequest(arguments).then(new_options => {
                    // console.log(new_options);
                    createSecondRequest(new_options).then(response => {
                        if (response.statusCode === 401) {
                            reject(response);
                        } else {
                            resolve(response);
                        }
                    }).catch(err => {
                        reject(err);
                    })

                }).catch(ex => {
                    console.log(ex);
                })
                // Debug: reject for now
                // reject(body);

                // Store the headers

                // Make the request again with digest auth
            } else {
                // You are already authenticated
                resolve(body);
            }
        });

    });
}

function post(options, username, password, body) {
    return new Promise((resolve, reject) => {

        let host = getHost(options.url);
        let path = getPath(options.url);

        options.headers.host = host;
        options.headers.path = path;

        // console.log(options);
        console.log("Attempting request");

        request(options, body, (err, response, body) => {
            if (response.statusCode === 401) {
                console.log("Request requires digest auth. Processing...");
                // console.log(response.headers);

                let arguments = {
                    username: username,
                    password: password,
                    options: options,
                    response: response,
                    body: body
                };

                buildDigestRequest(arguments).then(new_options => {
                    // console.log(new_options);
                    createSecondRequest(new_options).then(response => {
                        if (response.statusCode === 401) {
                            reject(response);
                        } else {
                            resolve(response);
                        }
                    }).catch(err => {
                        reject(err);
                    })

                }).catch(ex => {
                    console.log(ex);
                })
                // Debug: reject for now
                // reject(body);

                // Store the headers

                // Make the request again with digest auth
            } else {
                // You are already authenticated
                resolve(body);
            }
        });

    });
}

function getHost(url) {
    let resString = url.replace("http://", "").replace("https://", "");
    let returnMe = resString.split("/");
    return returnMe[0];
}

function getPath(url) {
    let resString = url.replace("http://", "").replace("https://", "");
    let returnMe = resString.split("/");
    return "/" + returnMe[1];
}

function buildDigestRequest(args) {
    // username, password, options, res, body
    return new Promise((resolve, reject) => {
        console.log("Building arguments for second request...\n");

        let username = args.username;
        let password = args.password;
        let body = args.body;
        let options = args.options;
        let res = args.response;

        let stringFromHeaders;
        let realm;
        let nonce;
        let qop;

        try {
            stringFromHeaders = res.headers['www-authenticate'];
            //Store the WWW-Authenticate into a JSON
            jsonHEADERS = splitIntoJSON(stringFromHeaders);

            realm = jsonHEADERS.realm;
            nonce = jsonHEADERS.nonce + "==";
            qop = jsonHEADERS.qop;

            let cnonce = randomString(48);
            let nc = "";

            let beforeHA1 = username + ":" + realm + ":" + password;
            // console.log("Before HA1:", beforeHA1);
            let beforeHA2 = args.options.method + ":" + options.headers.path;
            // console.log("Before HA2:", beforeHA2);
            let ha1 = md5(beforeHA1);
            let ha2 = md5(beforeHA2);
            let beforeResponse = ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + ha2;
            // console.log("Before Response:", beforeResponse);
            let actualResponse = md5(ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + ha2);
            //
            // console.log("Before 1st Hash: " + beforeHA1 + "\n" +
            //     "Before 2nd Hash: " + beforeHA2 + "\n" +
            //     "HA1: " + ha1 + "\n" +
            //     "HA2: " + ha2 + "\n" +
            //     "Response: " + actualResponse + "\n");

            digestString = "Digest username=\"" + username + "\", " +
                `realm="${realm}", ` +
                "nonce=\"" + nonce + "\", " +
                "uri=\"" + options.headers.path + "\", " +
                "qop=" + qop + ", " +
                "nc=" + ", " +
                "cnonce=\"" + cnonce + "\", " +
                "response=\"" + actualResponse + "\", " +
                "opaque=, ";

            //We have to set up our options now.
            let options2 = options;
            options2.headers.Authorization = digestString;
            options2.mode= 'no-cors';

            // options2 = {
            //     host: options.headers.host,
            //     path: options.headers.path,
            //     mode: 'no-cors',
            //     headers: {
            //         Authorization: digestString
            //     }
            // };

            // console.log("Your options for this request: \n" + JSON.stringify(options2, null, 4));
            // console.log("\n\nA nicer view of your digest string: \n");
            // console.log(nicerDigest(digestString));

            //NOW WE MAKE A SECOND REQUEST
            resolve(options2);
        } catch (ex) {
            // console.log("ERROR: \n" + ex);
            // console.log("BLEH");
            reject(ex);
        }
    })
}

function createSecondRequest(options) {
    console.log("Request options: ", options);
    return new Promise((resolve, reject) => {
        request(options, (err, response, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    })
}




/*==============================================================================
    Utility Methods
==============================================================================*/


function splitIntoJSON(stringToSplit) {
    let finalObject = {};

    //Separate all values into an array
    let commaSplit = stringToSplit.split(",");

    for (let i = 0; i < commaSplit.length; i++) {

        //For each pair of values, split by equals
        let equalsSplit = commaSplit[i].split("=");

        //If this is running the first time, remove the 'Digest' text
        if (i === 0) {
            equalsSplit[0] = equalsSplit[0].replace(/Digest/g, '');
        }

        //Remove spaces from letiable names
        let spacesRemoved = removeSpaces(equalsSplit[0].toString());
        finalObject[spacesRemoved.toString()] = removeEscapes(equalsSplit[1]);
    }

    return finalObject;
}

function removeSpaces(processMe) {
    return processMe.replace(/\s+/g, '');
}

function removeEscapes(processMe) {
    return processMe.replace(/\"/g, '');
}

let randomString = function(length) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

let nicerDigest = function(sentDigestString) {
    let digestArray = sentDigestString.split(",");
    let escapedString = "";
    for (let i = 0; i < digestArray.length; i++) {
        escapedString += digestArray[i] + "\n";
    }
    return escapedString;
};

module.exports = {
    request: wrapper
};
