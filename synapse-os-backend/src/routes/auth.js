const express = require("express");
const jwt = require("jsonwebtoken");
const { authenticate } = require("../middleware/auth");
const database = require("../services/database");
const { getAuthUrl, exchangeCodeForTokens, saveTokens, getUserInfo } = require("../services/googleAuth");

const router = express.Router();

function buildSessionUser(decodedUser) {
  const storedUser =
    database.getUserById(decodedUser.userId) ||
    (decodedUser.email ? database.getUserByEmail(decodedUser.email) : null);

  if (!storedUser) {
    return decodedUser;
  }

  return {
    ...decodedUser,
    ...storedUser,
    userId: storedUser.id,
    id: storedUser.id,
  };
}

router.get("/google", (req, res) => {
  const state = req.query.userId || "";
  const url = getAuthUrl(state);
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?reason=${error}`);
    }

    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens);

    const user = database.upsertUser({
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      role: "admin",
    });

    saveTokens(user.id, tokens);

    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${sessionToken}`);
  } catch (err) {
    console.error("Google OAuth error:", err.message);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?reason=server_error`);
  }
});

router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: buildSessionUser(decoded) });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

router.get("/team", authenticate, (req, res) => {
  res.json({ users: database.listUsers() });
});

router.patch("/profile", authenticate, (req, res, next) => {
  try {
    const user = database.updateUserProfile(req.user.userId, {
      designation: req.body.designation,
      phone: req.body.phone,
      managerName: req.body.managerName,
      managerEmail: req.body.managerEmail,
      managerPhone: req.body.managerPhone,
    });

    res.json({
      user: {
        ...req.user,
        ...user,
        userId: user.id,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out. Clear your local token." });
});

module.exports = router;
