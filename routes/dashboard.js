const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

let connection;
const db = async () => {
  try {
    connection = await mysql.createConnection({
      host     : process.env.MYSQL_HOST,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PW,
      database : 'choreonote'
    });
  } catch (err) {
    console.error(err);
  }
}
db();

router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    res.sendFile('dashboard.html', { root: path.join(__dirname, '../views') });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/create_note', isLoggedIn, async (req, res, next) => {
  try {
  	const [ rows ] = await connection.query(
      "INSERT INTO note (uid) VALUES (?);",
      [req.user.id]
    );
    res.send({ noteId: rows.insertId });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;