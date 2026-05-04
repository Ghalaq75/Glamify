const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const providersRoutes = require('./routes/providers');
const clientRoutes = require('./routes/client');
const providerRoutes = require('./routes/provider');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', providersRoutes);
app.use('/api', clientRoutes);
app.use('/api', providerRoutes);
app.use('/api', adminRoutes);

app.use(errorHandler);

module.exports = app;
