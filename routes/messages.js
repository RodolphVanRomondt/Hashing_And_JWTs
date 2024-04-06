const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const ExpressError = require("../expressError");

const {
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
router.get("/:id", async (req, res, next) => {

    try {

        const id = req.params.id;

        const message = await Message.get(id);

        console.log(message);

        return res.json(message);

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
// router.post("/", async () => {

//     try {

//     } catch (e) {
//         return next(e);
//     }
// });


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
// router.post("/:id", async () => {

//     try {

//     } catch (e) {
//         return next(e);
//     }
// });
