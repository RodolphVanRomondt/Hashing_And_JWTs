/* Necessary modules */
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function (req, res, next) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw new ExpressError("Missing Key.", 400);
        }

        if (await User.authenticate(username, password)) {
            const token = jwt.sign({ username }, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({ token });
        } else {
            throw new ExpressError("Invalid credentials", 400);
        }
    }

    catch (e) {
        return next(e);
    }
});


/** register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        if (!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError("Missing Key.", 400);
        }

        await User.register({ username, password, first_name, last_name, phone });

        const token = jwt.sign({ username }, SECRET_KEY);

        User.updateLoginTimestamp(username);

        return res.json({ token });
    }

    catch (e) {
        return next(e);
    }
});


module.exports = router;