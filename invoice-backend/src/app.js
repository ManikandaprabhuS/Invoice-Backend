const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());

app.use(express.json());
app.use('/auth', require('./routes/auth.routes'));
app.use('/api', require('./routes/protected.routes'));
app.use('/api', require('./routes/user.routes'));
app.use('/api', require('./routes/invoice.routes'));
app.use('/api', require('./routes/service.routes'));
app.use('/api/quick-add-income', require('./routes/quick-add-income.routes'));
app.use('/api/expenses', require('./routes/expense.routes'));


module.exports = app;
