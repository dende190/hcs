require('dotenv').config();
const config = {
  mongoUri: (
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`
  ),
};

module.exports = { config };
