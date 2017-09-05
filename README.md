# Abalobi Digest Auth

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