const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const User = require("../models/user");
const ExpressError = require("../expressError");

const {
    authenticateJWT,
    ensureLoggedIn,
    ensureCorrectUser
} = require("../middleware/auth");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {

    try {

        const username = req.user.username;
        const message = await Message.get(req.params.id);

        if (message.from_user.username === username || message.to_user.username === username) {
            return res.json({ message });
        }
        throw new ExpressError(`Don't have access to read this message`, 401);
    } catch (e) {
        return next(e);
    }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {

    try {
        const from_username = req.user.username;
        const { to_username, body } = req.body;

        await User.get(to_username);

        if (!to_username || !body) {
            throw new ExpressError("Missing Key.", 400);
        }
        if (from_username === to_username) {
            throw new ExpressError("Can't send a message to yourself.", 400);
        }

        const message = await Message.create({ from_username, to_username, body });

        return res.json({ message });

    } catch (e) {
        return next(e);
    }
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {

    try {
        const { username } = req.user;
        let message = await Message.get(req.params.id);

        if (message.to_user.username === username) {
            message = await Message.markRead(req.params.id);
            return res.json({ message });
        }
        throw new ExpressError(`Can't mark this message as read.`, 401);
    } catch (e) {
        return next(e);
    }
});


module.exports = router;