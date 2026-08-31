const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {

    // Allow Postman / server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}));

app.use(express.json());

app.use('/auth', require('./routes/auth.routes'));
app.use('/api', require('./routes/protected.routes'));
app.use('/api', require('./routes/user.routes'));
app.use('/api', require('./routes/invoice.routes'));
app.use('/api', require('./routes/service.routes'));
app.use('/api/quick-add-income', require('./routes/quick-add-income.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));

module.exports = app;
