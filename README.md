# DEPRECATED - DO NOT USE - THIS REPO HAS BEEN MOVED TO BITBUCKET
See https://bitbucket.org/abalobi

# Abalobi Digest Auth

Installation:

    $ yarn add git+https://git@github.com/AbalobiSA/ablb-digest-auth.git

Usage example:

```
let OPTIONS = {
    method: 'GET',
    url: YOUR_URL_HERE,
    headers: {
        "Accept-Language" : "en-us",
        "X-OpenRosa-Version": "1.0",
        "YOUR_HEADERS_HERE" : "YOUR_VALUE_HERE"
    }
};

digest.request(OPTIONS, username, password).then(success => {
    console.log("Success", success);
}).catch(ex => {
    console.log(ex);
});
```

