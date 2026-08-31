const express = require('express');
const app = express();
const cors = require('cors');

const configuredFrontendUrls = (
  process.env.FRONTEND_URLS || process.env.FRONTEND_URL || ''
)
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = configuredFrontendUrls.length
  ? configuredFrontendUrls
  : ['http://localhost:4200', 'http://127.0.0.1:4200'];

app.use(cors({ origin: allowedOrigins }));

app.use(express.json());
app.use('/auth', require('./routes/auth.routes'));
app.use('/api', require('./routes/protected.routes'));
app.use('/api', require('./routes/user.routes'));
app.use('/api', require('./routes/invoice.routes'));
app.use('/api', require('./routes/service.routes'));
app.use('/api/quick-add-income', require('./routes/quick-add-income.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));


module.exports = app;
