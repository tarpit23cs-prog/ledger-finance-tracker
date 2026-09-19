const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};

// PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, currency, theme, budgetAlerts } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (currency !== undefined) user.currency = currency;
    if (theme !== undefined) user.theme = theme;
    if (budgetAlerts !== undefined) user.budgetAlerts = budgetAlerts;

    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "New password must be at least 6 characters" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, updateMe, changePassword };
