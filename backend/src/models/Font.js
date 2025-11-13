const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Font = sequelize.define('Font', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  family: {
    type: DataTypes.STRING(190),
    allowNull: false
  },
  format: {
    type: DataTypes.ENUM('woff2', 'woff', 'truetype', 'opentype'),
    allowNull: false
  },
  dataUrl: {
    type: DataTypes.TEXT('long'), // Para dataURL largos
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'fonts'
});

module.exports = { Font };