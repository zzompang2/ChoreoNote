const express = require('express');
const path = require('path');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.get('/', isNotLoggedIn, async (req, res, next) => {
  try {
    res.render('home');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/join', isNotLoggedIn, async (req, res, next) => {
  try {
    res.render('join');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;