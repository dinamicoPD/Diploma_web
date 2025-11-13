const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Design = sequelize.define('Design', {
  id: {
    type: DataTypes.UUID,       // id UUID
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(190),
    allowNull: false,
    unique: true
  },
  // JSON con format, orientation, dpi, backgroundUrl, medalImages
  data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  // Opcional: medallas centralizadas (dataURL) si quieres
  medal_images: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'designs'
});

// Import Element after define to avoid circular
const { Element } = require('./Element');
Design.hasMany(Element, { foreignKey: 'designId', as: 'elements', onDelete: 'CASCADE' });
Element.belongsTo(Design, { foreignKey: 'designId' });

module.exports = { Design };
