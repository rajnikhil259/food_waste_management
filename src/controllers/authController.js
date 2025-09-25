const bcrypt = require('bcrypt');
const User = require('../models/user');

const AuthController = {
  async register(req, res) {
    const { name, email, password, role, organization_name, location } = req.body;
    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).send('Email already registered');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        organization_name,
        location,
      });
      req.session.user = user;
      res.redirect(`/${role}`);
    } catch (err) {
      res.status(500).send('Registration error');
    }
  },

  async login(req, res) {
    const { email, password } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).send('Invalid email or password');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).send('Invalid email or password');
      }
      req.session.user = user;
      res.redirect(`/${user.role}`);
    } catch (err) {
      res.status(500).send('Login error');
    }
  },

  logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  }
};

module.exports = AuthController;