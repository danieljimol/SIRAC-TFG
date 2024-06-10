'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Asignatura extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Profesor, { foreignKey: 'profesorId' });
      this.belongsToMany(models.Alumno, { through: 'AlumnoAsignatura', foreignKey: 'asignaturaId' });
      this.hasMany(models.Horario, { foreignKey: 'asignaturaId' });
    }
  }
  Asignatura.init({
    nombre: DataTypes.STRING,
    profesorId: DataTypes.INTEGER,
    codigo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Asignatura',
  });
  return Asignatura;
};