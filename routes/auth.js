/** Routes for user login and registration */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const ExpressError = require("../expressError");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");

const router = new express.Router();

/** POST / - user login */

router.post("/login", async function (req, res, next) {
    try {
        const { username, password } = req.body;
        const user = await User.authenticate(username, password);

        if(!user)
            throw new ExpressError("Invalid username/password.", 400);

        await User.updateLoginTimestamp(username);
        let token = jwt.sign({ username }, SECRET_KEY);

        return res.json({ token });

    } catch (err) {
        return next(err);
    }
});

/** POST / - user registration */

router.post("/register", async function (req, res, next) {
    try {
        const {username, password, first_name, last_name, phone} = req.body;
        if(!username||!password) throw new ExpressError("Username and password required.", 400);
        if(!first_name||!last_name) throw new ExpressError("First and last name required.", 400);
        if(!phone) throw new ExpressError("Phone number required.", 400);

        const user = await User.register({username, password, first_name, last_name, phone});

        if (!user) throw new ExpressError("Unable to create user.", 409);

        let token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });

    } catch (err) {
        if (String(err.detail).includes('Key (username)=') && err.code === '23505') 
            return next(new ExpressError("Username taken. Please pick another.", 409));
        return next(err);
    }
});


module.exports = router;