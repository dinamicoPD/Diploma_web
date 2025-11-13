const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,         // diplomas_db
  process.env.DB_USER,         // diplomas_user
  process.env.DB_PASS,         // tu_password_segura
  {
    host: process.env.DB_HOST, // 127.0.0.1
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,   // createdAt/updatedAt
      underscored: true   // columnas created_at / updated_at
    }
  }
);

async function initDb() {
  await sequelize.authenticate(); // Verifica conexión
}

module.exports = { sequelize, initDb };
