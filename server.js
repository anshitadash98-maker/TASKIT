require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Initialize database & seed demo data
require('./database');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// Navigation routing
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

module.exports = app;

if (require.main === module) {
  const PRIMARY_PORT = parseInt(process.env.PORT, 10) || 5000;
  const SECONDARY_PORT = 3000;

  const server = app.listen(PRIMARY_PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`TASKIT — Modern SaaS Productivity Dashboard`);
    console.log(`Access application at: http://localhost:${PRIMARY_PORT}`);
    console.log(`Access application at: http://127.0.0.1:${PRIMARY_PORT}`);
    console.log(`Demo Account: demo@taskora.com | Password: Taskora123!`);
    console.log(`=================================================`);
  });

  if (PRIMARY_PORT !== SECONDARY_PORT) {
    try {
      const secondaryServer = app.listen(SECONDARY_PORT, '0.0.0.0', () => {
        console.log(`Secondary access active: http://localhost:${SECONDARY_PORT}`);
      });
      secondaryServer.on('error', (err) => {
        console.log(`Note: Port ${SECONDARY_PORT} busy (${err.code}), continuing on primary port ${PRIMARY_PORT}.`);
      });
    } catch (e) {
      // Port 3000 already bound
    }
  }
}
