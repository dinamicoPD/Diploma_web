const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Element = sequelize.define('Element', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  designId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'designs',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'medal'),
    allowNull: false
  },
  x: { type: DataTypes.FLOAT, allowNull: false },
  y: { type: DataTypes.FLOAT, allowNull: false },
  w: { type: DataTypes.FLOAT, allowNull: false },
  h: { type: DataTypes.FLOAT, allowNull: false },
  z: { type: DataTypes.INTEGER, allowNull: false },
  properties: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'elements'
});

module.exports = { Element };