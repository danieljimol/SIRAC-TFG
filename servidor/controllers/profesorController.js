// controllers/profesorController.js
const { Profesor } = require('../models');

async function findProfesorByEmail(email) {
  return await Profesor.findOne({
    where: { correo: email }
  });
}

async function createProfesor(profesorData) {
  return await Profesor.create(profesorData);
}

const profesorController = {
  async create(req, res) {
    try {
      const profesor = await Profesor.create(req.body);
      res.status(201).send(profesor);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getAll(req, res) {
    try {
      const profesors = await Profesor.findAll();
      res.status(200).send(profesors);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getById(req, res) {
    try {
      const profesor = await Profesor.findByPk(req.params.id);
      if (!profesor) {
        return res.status(404).send({ message: 'Profesor no encontrado' });
      }
      res.status(200).send(profesor);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async update(req, res) {
    try {
      const [updated] = await Profesor.update(req.body, {
        where: { id: req.params.id }
      });
      if (updated) {
        const updatedProfesor = await Profesor.findByPk(req.params.id);
        res.status(200).send(updatedProfesor);
      } else {
        res.status(404).send({ message: 'Profesor no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Profesor.destroy({
        where: { id: req.params.id }
      });
      if (deleted) {
        res.status(204).send({ message: 'Profesor eliminado' });
      } else {
        res.status(404).send({ message: 'Profesor no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
};

module.exports = {
  profesorController,
  findProfesorByEmail,
  createProfesor
};
