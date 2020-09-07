# CMS One API
> Simple light weight node-express based API wrapper

## Installation:
- Add auth.json with any authkey at data/ folder. (this key will be used while configuring CMS from GUI)
- Add emails.json with noreply email and noreplyName title at root directory. (Open sample emails.json for ref) 


```
npm install cmsone-api --save
```


Setup your API
```
const express = require('express');
const app = express();
const { Main } = require('cmsone-api');

Main.setup(app, {
    production: {
        MONGODB_CONNECTION: 'mongodb+srv://XXXX:XXXX@XXXX-XXXX.mongodb.net/XXXX',
        HAS_CERT: false,
        DATABASE_NAME: 'XXXX',
        EMAILID: 'XXXX@gmail.com',
        EMAIL_PASSWORD: 'password'
    }
});
```

## Features:
- Works with express.js and mongo as database.
- Provides basic APIs like Admin, Tracker, Analysis, NewsLetters etc.
- Easily extend by writing your APIs
- Works best with CMS One website (fronend helper for your CMS)