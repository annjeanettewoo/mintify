// services/gateway-service/src/index.js
require('dotenv').config();
const { app } = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`gateway-service running on port ${PORT}.`);
});
