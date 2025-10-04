
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));


// Setup EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve login and registration HTML pages
app.get('/', (req, res) => {
  res.render('landing');
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'registration.html'));
});

// Registration
app.post('/registration', async (req, res) => {
  const { name, email, password, role, organization_name, location } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role, organization_name, location) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, email, hashedPassword, role, organization_name || null, location]
    );
    console.log(`User registered: ${email} as ${role}`);
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Error registering user');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).send('Invalid email or password');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    req.session.user = user;
    console.log(`User logged in: ${email} as ${user.role}`);

    if (user.role === 'donor') {
      res.redirect('/donor');
    } else if (user.role === 'receiver') {
      res.redirect('/receiver');
    } else {
      res.status(403).send('Invalid role');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Error logging in');
  }
});

// Middleware to check authentication
function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

/**
 * RECEIVER DASHBOARD
 * Shows:
 *  - Their requests (pending and fulfilled)
 *  - Requests can have donations assigned (donation_id)
 *  - Form to add new request
 */
app.get('/receiver', checkAuth, async (req, res) => {
  if (req.session.user.role !== 'receiver') {
    return res.status(403).send('Access denied');
  }

  const receiverId = req.session.user.id;

  try {
    // Get all requests by receiver, including donation info
    const requestsResult = await pool.query(
      `SELECT fr.*, d.id AS donation_id
       FROM food_requests fr
       LEFT JOIN donations d ON fr.id = d.request_id AND d.status != 'fulfilled'
       WHERE fr.receiver_id = $1
       ORDER BY fr.id DESC`,
      [receiverId]
    );

    // Separate requests by status
    const requests = requestsResult.rows.filter(r => r.status !== 'fulfilled');
    const fulfilledRequests = requestsResult.rows.filter(r => r.status === 'fulfilled');

    res.render('receiver', {
      user: req.session.user,
      requests,
      fulfilledRequests,
    });
  } catch (err) {
    console.error('Error loading receiver dashboard:', err);
    res.status(500).send('Server error');
  }
});

// Handle food request submission by receiver
app.post('/request-food', checkAuth, async (req, res) => {
  if (req.session.user.role !== 'receiver') {
    return res.status(403).send('Access denied');
  }

  const { food_type, quantity, location, description } = req.body;
  const receiver_id = req.session.user.id;

  try {
    await pool.query(
      `INSERT INTO food_requests (receiver_id, food_type, quantity, location, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [receiver_id, food_type, quantity, location, description]
    );
    console.log('Food request created');
    res.redirect('/receiver');
  } catch (err) {
    console.error('Error creating food request:', err);
    res.status(500).send('Server error');
  }
});

/**
 * DONOR DASHBOARD
 * Shows:
 *  - All pending requests (not fulfilled, and not yet donated)
 *  - Sidebar with their donations (pending or fulfilled)
 */
app.get('/donor', checkAuth, async (req, res) => {
  if (req.session.user.role !== 'donor') {
    return res.status(403).send('Access denied');
  }

  const donorId = req.session.user.id;

  try {
    // Get all pending requests that do not have active donations
    const requestsResult = await pool.query(
      `SELECT fr.*, u.name as receiver_name
       FROM food_requests fr
       JOIN users u ON fr.receiver_id = u.id
       WHERE fr.status = 'pending'
         AND fr.id NOT IN (
           SELECT request_id FROM donations WHERE status = 'pending' OR status = 'in_progress'
         )
       ORDER BY fr.id DESC`
    );

    // Get donations by this donor
    const donatedResult = await pool.query(
      `SELECT d.*, fr.food_type, fr.quantity, u.name AS receiver_name
       FROM donations d
       JOIN food_requests fr ON d.request_id = fr.id
       JOIN users u ON fr.receiver_id = u.id
       WHERE d.donor_id = $1
       ORDER BY d.id DESC`,
      [donorId]
    );

    res.render('donor', {
      user: req.session.user,
      requests: requestsResult.rows,
      donatedRequests: donatedResult.rows,
    });
  } catch (err) {
    console.error('Error loading donor dashboard:', err);
    res.status(500).send('Server error');
  }
});

app.get('/donor/search', checkAuth, async (req, res) => {
  if (req.session.user.role !== 'donor') {
    return res.status(403).send('Access denied');
  }

  const donorId = req.session.user.id;
  const location = req.query.location?.trim() || '';

  try {
    // Fetch pending requests matching location
    const requestsResult = await pool.query(
      `SELECT fr.*, u.name as receiver_name
       FROM food_requests fr
       JOIN users u ON fr.receiver_id = u.id
       WHERE fr.status = 'pending'
         AND fr.location ILIKE $1
         AND NOT EXISTS (
           SELECT 1 
           FROM donations d 
           WHERE d.request_id = fr.id 
             AND (d.status = 'pending' OR d.status = 'in_progress')
         )
       ORDER BY fr.id DESC`,
      [`%${location}%`]
    );

    // Fetch donor's donations
    const donatedResult = await pool.query(
      `SELECT d.*, fr.food_type, fr.quantity, u.name AS receiver_name
       FROM donations d
       JOIN food_requests fr ON d.request_id = fr.id
       JOIN users u ON fr.receiver_id = u.id
       WHERE d.donor_id = $1
       ORDER BY d.id DESC`,
      [donorId]
    );

    res.render('donor', {
      user: req.session.user,
      requests: requestsResult.rows,
      donatedRequests: donatedResult.rows,
      searchLocation: location,
    });

  } catch (err) {
    console.error('Error in location search:', err);
    res.status(500).send('Server error');
  }
});

// Donor donates to a request
app.post('/donate', checkAuth, async (req, res) => {
  if (req.session.user.role !== 'donor') {
    return res.status(403).send('Access denied');
  }

  const donor_id = req.session.user.id;
  const { request_id, message } = req.body;

  try {
    // Check if donation already exists for this request (prevent duplicates)
    const existing = await pool.query(
      'SELECT * FROM donations WHERE request_id = $1 AND status != $2',
      [request_id, 'fulfilled']
    );

    if (existing.rows.length > 0) {
      return res.status(400).send('This request already has a donation in progress');
    }

    // Insert donation with status 'pending'
    await pool.query(
      `INSERT INTO donations (donor_id, request_id, message, status)
       VALUES ($1, $2, $3, 'pending')`,
      [donor_id, request_id, message]
    );

    console.log(`Donor ${donor_id} donated to request ${request_id}`);

    res.redirect('/donor');
  } catch (err) {
    console.error('Error creating donation:', err);
    res.status(500).send('Server error');
  }
});

/**
 * Receiver confirms donation received
 * - Marks donation status as fulfilled
 * - Marks food_request status as fulfilled
 */
app.post('/confirm-donation', checkAuth, async (req, res) => {
  if (req.session.user.role !== 'receiver') {
    return res.status(403).send('Access denied');
  }

  const receiverId = req.session.user.id;
  const { donation_id, request_id } = req.body;

  try {
    // Check the request belongs to this receiver
    const reqResult = await pool.query(
      'SELECT * FROM food_requests WHERE id = $1 AND receiver_id = $2',
      [request_id, receiverId]
    );
    if (reqResult.rows.length === 0) {
      return res.status(403).send('Invalid request');
    }

    // Update donation status to 'fulfilled'
    await pool.query('UPDATE donations SET status = $1 WHERE id = $2', ['fulfilled', donation_id]);

    // Update food_request status to 'fulfilled'
    await pool.query('UPDATE food_requests SET status = $1 WHERE id = $2', ['fulfilled', request_id]);

    console.log(`Donation ${donation_id} and request ${request_id} marked as fulfilled`);

    res.redirect('/receiver');
  } catch (err) {
    console.error('Error confirming donation:', err);
    res.status(500).send('Server error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.redirect('/login');
  });
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

