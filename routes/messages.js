const express = require("express");
const jwt = require("jsonwebtoken");

const Message = require("../models/message");
const ExpressError = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const { SECRET_KEY } = require("../config");

const router = new express.Router();


/** GET /:id - get details of message */

router.get("/:id/", 
        ensureLoggedIn,
            async function(req, res, next) {
    try {
        const message = await Message.get(req.params.id);
        const tokenFromBody = req.body._token;
        const payload = jwt.verify(tokenFromBody, SECRET_KEY);

        // auth - ensure logged-in user is either the to or from user
        if(payload.username !== message.from_user.username &&
            payload.username !== message.to_user.username)
            throw new ExpressError("Unauthorized.", 401);

        return res.json({ message });

    } catch (err) {
        return next(err);
    }
});


/** POST / - post message */

router.post("/", 
    ensureLoggedIn,
        async function (req, res, next) {
    try {
        const { to_username, body } = req.body;
        const tokenFromBody = req.body._token;
        const payload = jwt.verify(tokenFromBody, SECRET_KEY);

        if(!to_username) throw new ExpressError("To: username required.", 400);
        if(!body) throw new ExpressError("Message body required.", 400);

        const message = await Message.create({from_username:payload.username, to_username, body});

        if (!message) throw new ExpressError("Unable to create message.", 409);

        return res.json({ message });

    } catch (err) {
        return next(err);
    }
});


/** POST/:id/read - mark message as read */

router.post("/:id/read", 
    ensureLoggedIn,
        async function (req, res, next) {
    try {
        const id = req.params.id;
        const tokenFromBody = req.body._token;
        const payload = jwt.verify(tokenFromBody, SECRET_KEY);

        const message = await Message.get(id);

        if(payload.username !== message.to_user.username)
            throw new ExpressError("Unauthorized.", 401);

        const results = await Message.markRead(id);
        return res.json({ message: { results } });

    } catch (err) {
        return next(err);
    }
});


module.exports = router;

