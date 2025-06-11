const express = require("express");
const {
  registeration,
  login,
  refreshTokenUser,
  logoutUser,
} = require("../controllers/identity_ct");

const router = express.Router();

router.post("/register", registeration);
router.post("/login", login);
router.post("/refresh-token", refreshTokenUser);
router.post("/logout", logoutUser);

module.exports = router;