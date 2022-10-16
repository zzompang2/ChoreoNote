const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.sendFile('stage.html', { root: path.join(__dirname, '../views') });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;