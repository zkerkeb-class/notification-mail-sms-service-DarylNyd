// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(express.json());

// Use notification routes
app.use('/', notificationRoutes);

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
}); 