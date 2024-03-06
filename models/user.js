/** User class for message.ly */

const bcrypt = require("bcrypt");

const db = require("../db");
const ExpressError = require("../expressError");

/** User of the site. */

class User {

  /** register new user */

  static async register(username, password, first_name, last_name, phone) {
    const results = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
      [username, password, first_name, last_name, phone]);
    return results.rows[0];
  }

  /** authenticate a user */

  static async authenticate(username, password) { 
    const results = await db.query(
      `SELECT password 
        FROM users 
        WHERE username=$1`,
      [username]);
    const user = results.rows[0];
    if (!user)
      throw new ExpressError(`Unable to find user with username: ${username}`, 401);
    return await bcrypt.compare(password, user.password) === true;
  }

  /** update last login time of user */

  static async updateLoginTimestamp(username) { 
    const results = await db.query(
      `UPDATE users 
        SET last_login_at=current_timestamp
        WHERE username=$1
        RETURNING username`, 
      [username])
    const user = results.rows[0];
    if (!user)
      throw new ExpressError(`Unable to find user with username: ${username}`, 401);
  }

  /** get basic info on all users */

  static async all() { 
    const results = await db.query(
      `SELECT
          username,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at
        FROM users`);   
    return results.rows;
  }

  /** Get: get user by username */

  static async get(username) {
    const results = await db.query(
      `SELECT
          username,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at
        FROM users
        WHERE username=$1`,
        [username]);   
    const user = results.rows[0];
    if (!user)
      throw new ExpressError(`Unable to find user with username: ${username}`, 401);
    return user;
   }

  /** Return messages from this user */

  static async messagesFrom(username) { 
    const results = await db.query(
      `SELECT 
          m.id,
          m.to_username,
          t.first_name AS to_first_name,
          t.last_name AS to_last_name,
          t.phone AS to_phone,
          m.body,
          m.sent_at,
          m.read_at
        FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
          JOIN users AS t ON m.to_username = t.username
        WHERE f.username = $1`,
      [username]);

    let messages = results.rows.map(m => {
        return {
          id: m.id,
          to_user: {
            username: m.to_username,
            first_name: m.to_first_name,
            last_name: m.to_last_name,
            phone: m.to_phone,
          },
          body: m.body,
          sent_at: m.sent_at,
          read_at: m.read_at,
        }
      });

    return messages;

  }

  /** Return messages to this user */

  static async messagesTo(username) { 
    const results = await db.query(
      `SELECT 
          m.id,
          m.to_username,
          f.first_name AS to_first_name,
          f.last_name AS to_last_name,
          f.phone AS to_phone,
          m.body,
          m.sent_at,
          m.read_at
        FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
          JOIN users AS t ON m.to_username = t.username
        WHERE t.username = $1`,
      [username]);

    let messages = results.rows.map(m => {
        return {
          id: m.id,
          from_user: {
            username: m.to_username,
            first_name: m.to_first_name,
            last_name: m.to_last_name,
            phone: m.to_phone,
          },
          body: m.body,
          sent_at: m.sent_at,
          read_at: m.read_at,
        }
      });

    return messages;
  }
}


module.exports = User;