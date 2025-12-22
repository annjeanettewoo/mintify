// src/index.js
require('dotenv').config();
const { app } = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`gateway-service running on port ${PORT}.`);
  console.log(
    `budget-service: ${process.env.BUDGET_SERVICE_URL || 'http://localhost:4002'}`
  );
  console.log(
    `transact-service: ${process.env.TRANSACT_SERVICE_URL || 'http://localhost:4003'}`
  );
  console.log(
    `notif-service: ${process.env.NOTIF_SERVICE_URL || 'http://localhost:4004'}`
  );
});
