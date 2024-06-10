'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ausencia extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Alumno, { foreignKey: 'alumnoId' });
      this.belongsTo(models.Asignatura, { foreignKey: 'asignaturaId' });
    }
  }
  Ausencia.init({
    alumnoId: DataTypes.INTEGER,
    asignaturaId: DataTypes.INTEGER,
    fecha: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Ausencia',
  });
  return Ausencia;
};