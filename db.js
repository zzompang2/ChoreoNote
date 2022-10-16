const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

let connection;

const db = async () => {
  try {
    connection = await mysql.createConnection({
      host     : process.env.MYSQL_HOST,
      user     : process.env.MYSQL_USER,
      password : process.env.MYSQL_PW,
      database : 'choreonote'
    });
    executeQuerys();
  } catch (err) {
    console.error(err);
  }
}
db();

function executeQuerys() {
  const dropQuerys = [
    `DROP TABLE IF EXISTS user;`,
  ];

  const createQuerys = [
    `
    CREATE TABLE IF NOT EXISTS user (
    id       INT NOT NULL AUTO_INCREMENT,
    service  CHAR(2) NOT NULL,
    snsId    CHAR(30),
    email    CHAR(40) NOT NULL UNIQUE,
    nick     CHAR(20) NOT NULL DEFAULT "",
    password CHAR(100),
    created_at DATETIME NOT NULL DEFAULT now(),
    PRIMARY KEY(id)
    );`
  ];

  dropQuerys.forEach(async query => await connection.query(query));
  createQuerys.forEach(async query => await connection.query(query));
  
  console.log("end query");
}
