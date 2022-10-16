const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

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

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      // 이미 회원가입한 사용자인지 확인
      const [[ exUser ]] = await connection.query(
        `SELECT * FROM user WHERE service = "cn" AND email = ? LIMIT 1;`,
        [email]);
      
      if (exUser) {
        const result = await bcrypt.compare(password, exUser.password);
        if (result)
        	done(null, exUser);
        else
          done(null, false, { message: '비밀번호가 일치하지 않습니다.'});
      }
      // 회원가입하지 않은 사용자인 경우
      else
        done(null, false, { message: '가입되지 않은 회원입니다.'});
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};