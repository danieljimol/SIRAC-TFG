'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AlumnoAsignatura extends Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.Alumno, { foreignKey: 'alumnoId' });
      this.belongsTo(models.Asignatura, { foreignKey: 'asignaturaId' });
    }   
  }

  AlumnoAsignatura.init({
    alumnoId: DataTypes.INTEGER,
    asignaturaId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AlumnoAsignatura',
  });

  return AlumnoAsignatura;
};
