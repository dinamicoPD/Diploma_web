const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dataUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'images'
});

module.exports = { Image };