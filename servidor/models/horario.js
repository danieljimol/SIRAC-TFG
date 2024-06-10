'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Horario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Asignatura, { foreignKey: 'asignaturaId' });
    }
  }
  Horario.init({
    asignaturaId: DataTypes.INTEGER,
    diaDeLaSemana: DataTypes.STRING,
    horaInicio: DataTypes.TIME,
    horaFin: DataTypes.TIME 
  }, {
    sequelize,
    modelName: 'Horario',
  });
  return Horario;
};