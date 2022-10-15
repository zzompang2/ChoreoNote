const express = require('express');
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/');
});

router.get('/logout', isLoggedIn, async (req, res) => {
  try {
    //req.logout();
    req.session.destroy();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.json(error);
  }
});

router.get('/google', passport.authenticate('google', { scope: ["email", "profile"] }));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/');
});

router.get('/user', async (req, res, next) => {
  res.send({ user: req.user });
});

module.exports = router;