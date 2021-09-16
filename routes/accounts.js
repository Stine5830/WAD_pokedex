const express = require('express');
const router = express.Router();

const Account = require('../models/account');
const jwt = require('jsonwebtoken');
const config = require('config');

const secret = config.get('jwt_secret_key');

router.post('/login', async (req, res) => {
    res.setHeader('Access-Control-Expose-Headers', 'x-authenticate-token');
    try {
        const { error } = Account.validate(req.body);
        if (error) throw { statusCode: 400, errorMessage: error };

        const accountObj = new Account(req.body);

        const account = await Account.checkCredentials(accountObj);

        const token = await jwt.sign(account, secret);
        res.setHeader('x-authenticate-token', token);

        return res.send(JSON.stringify(account));

    } catch (err) {
        console.log(err);
        
        if (!err.statusCode) return res.status(401).send(JSON.stringify({ errorMessage: 'Incorrect user email or password.' }));
        if (err.statusCode != 400) return res.status(401).send(JSON.stringify({ errorMessage: 'Incorrect user email or password.' }));
        return res.status(400).send(JSON.stringify({ errorMessage: err.errorMessage.details[0].message }));
    }
});

router.post('/', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
  
        const { error } = Account.validate(req.body);
        if (error) throw { statusCode: 400, errorMessage: error };

        const accountObj = new Account(req.body);

        const account = await accountObj.create();

        return res.send(JSON.stringify(account));
    } catch (err) {
        console.log(err);

        if (!err.statusCode) return res.status(500).send(JSON.stringify({ errorMessage: err }));
        if (err.statusCode != 400) return res.status(err.statusCode).send(JSON.stringify({ errorMessage: err }));
        return res.status(400).send(JSON.stringify({ errorMessage: err.errorMessage.details[0].message }));
    }
});

module.exports = router;