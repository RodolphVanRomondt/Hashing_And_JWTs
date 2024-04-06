/** User class for message.ly */

const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */
class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(`
        INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone
        `, [username, hashedPassword, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {

    const user = await db.query(`
      SELECT username, password FROM users WHERE username=$1
      `, [username]
    );

    if (!user.rows.length) {
      throw new ExpressError(`User "${username}" doesn't exist.`, 404);
    }

    return await bcrypt.compare(password, user.rows[0].password)
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {

    const result = await db.query(
      `UPDATE users
      SET last_login_at=current_timestamp
      WHERE username=$1
      RETURNING username, password, first_name, last_name, phone, join_at, last_login_at `,
      [username]);
    
    if (!result.rows.length) {
      throw new ExpressError(`Username "${username}" doesn't exitst.`, 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {

    const results = await db.query(
      `SELECT username, first_name, last_name, phone 
      FROM users`);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) {

    const user = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users WHERE username=$1`,
      [username]
    );

    if (!user.rows.length) {
      throw new ExpressError(`Username "${username}" doesn't exist.`, 404);
    }

    return user.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) {

    const results = await db.query(
      `SELECT id, to_username AS to_user, body, sent_at, read_at 
      FROM messages WHERE from_username=$1`
      , [username]);

    for (let msg of results.rows) {

      let res = await db.query(
        `SELECT username, first_name, last_name, phone FROM users WHERE username=$1`
        , [msg.to_user]);
      
      msg.to_user = res.rows[0]
    }

    return results.rows;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesTo(username) {

    const results = await db.query(
      `SELECT id, from_username AS from_user, body, sent_at, read_at FROM messages WHERE to_username=$1`
      , [username]);

    for (let msg of results.rows) {

      let res = await db.query(
        `SELECT username, first_name, last_name, phone FROM users WHERE username=$1`
        , [msg.from_user]);

      msg.from_user = res.rows[0]
    }

    return results.rows;
  }
}


module.exports = User;