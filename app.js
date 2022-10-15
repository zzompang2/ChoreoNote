const express = require('express');
const path = require('path');
const dotenv = require('dotenv');  // .env 파일 읽어서 process.env 로 만듦
dotenv.config();

const app = express();

const homeRouter = require('./routes/home');
const authRouter = require('./routes/auth');
const passportConfig = require('./passport');
passportConfig();		// 패스포트 설정

/* app.set(key, value) 으로 데이터 저장 & app.get(key) 으로 사용 */
app.set('port', process.env.PORT || 3000);

app.use(
	express.static(path.join(__dirname, 'public')),  // 정적파일 제공
  express.json({ limit: "50MB" }),                 // 요청의 본문 데이터 해석해서 req.body 객체로 생성(body-parser)
);

app.use('/', homeRouter);
app.use('/auth', authRouter);

// 에러처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});

app.listen(app.get('port'), () => {
  console.log(app.get('port') + '번 포트에서 대기 중...');
});