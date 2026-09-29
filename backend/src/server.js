require('dotenv').config(); // loads variables from .env into process.env

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Kwetu Hotel API running on http://localhost:${PORT}`);
});
