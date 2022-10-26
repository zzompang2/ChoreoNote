const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

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

const router = express.Router();

// router.get('/', isLoggedIn, async (req, res, next) => {
//   try {
//     const { id } = req.query;
    
//     const [[ note ]] = await connection.query(
//       "SELECT uid FROM note WHERE id = ?;",
//       [id]
//     );
    
//     console.log(note);
    
//     if (note.uid == req.user.id)
//     	res.render('note');
//     else
//       res.render('dashboard');
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// });

/* for debugging */
router.get('/', async (req, res, next) => {
  try {
    res.render('note');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/info', async (req, res, next) => {
  try {
    const { id } = req.query;
    const [[ note ]] = await connection.query(
      "SELECT * FROM note WHERE noteId = ? AND hide = false;",
      [id]
    );
    const [ dancers ] = await connection.query(
      "SELECT id, name, color FROM dancer WHERE nid = ?;",
      [note.id]
    );
    const [ times ] = await connection.query(
      "SELECT id, start, duration FROM time WHERE nid = ? ORDER BY start;",
      [note.id]
    );
    const [ postions ] = await connection.query(
      "SELECT tid, did, x, y FROM pos WHERE nid = ?;",
      [note.id]
    );
    
    res.send({ note, dancers, times, postions });
    
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post('/update', isLoggedIn, async (req, res, next) => {
  try {
    const { noteId, dancerArray, formationArray, musicInfo } = req.body;

    // 기존 노트 정보 가져오기
    const [[ originNote ]] = await connection.query(
      "SELECT * FROM note WHERE noteId = ? AND hide = ? LIMIT 1;",
      [ noteId, false ]
    );
    
    console.log("originNote", originNote);
    
    const [{ insertId: newId }] = await connection.query(
      "INSERT INTO note (noteId, uid, title, createdAt) VALUES (?, ?, ?, ?);",
      [ noteId, req.user.id, originNote.title, originNote.createdAt ]
    );
    
    dancerArray.forEach(async dancer => {
      await connection.query(
        "INSERT INTO dancer (nid, id, name, color) VALUES (?, ?, ?, ?);",
        [ newId, dancer.id, dancer.name, dancer.color ]
      );
    });
    
    formationArray.forEach(async formation => {
      await connection.query(
        "INSERT INTO time (nid, id, start, duration) VALUES (?, ?, ?, ?);",
        [ newId, formation.id, formation.time, formation.duration ]
      );

      formation.positionsAtSameTime.forEach(async pos => {
        await connection.query(
          "INSERT INTO pos (nid, tid, did, x, y) VALUES (?, ?, ?, ?, ?);",
          [ newId, pos.tid, pos.did, pos.x, pos.y ]
        );
      });
    });
    
    await connection.query(
      "UPDATE note SET hide = true WHERE id = ?;",
      [ originNote.id ]
    );

    res.json({ success: true });
    
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;