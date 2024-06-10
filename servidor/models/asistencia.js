'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Asistencia extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Alumno, { foreignKey: 'alumnoId' });
    }
  }
  Asistencia.init({
    alumnoId: DataTypes.INTEGER,
    asignaturaId: DataTypes.INTEGER,
    fecha: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Asistencia',
  });
  return Asistencia;
};