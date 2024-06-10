// controllers/asistenciaController.js
const { Asistencia } = require('../models');
const { alumnoController, findAlumnoByEmail, createAlumno } = require('./alumnoController');
const { obtenerAsignaturaActualProfesor, obtenerAsignaturaActualAlumno } = require('./horarioController');
const { Op, where, Sequelize } = require('sequelize');
const { io } = require('../socket');
const { Alumno, Ausencia, Horario, Asignatura } = require('../models');

async function registrarAusencias(asignaturaId, fechaClase) {
  try {
    // Convertir fechaClase a un formato correcto si es necesario
    const fecha = new Date(fechaClase).toISOString().slice(0, 10); // Asegura que la fecha está en formato 'YYYY-MM-DD'

    // Encuentra todos los alumnos que deberían haber asistido a la clase
    const alumnos = await Alumno.findAll();

    // Para cada alumno, verifica si asistió a la clase
    for (let alumno of alumnos) {
      const asistencia = await Asistencia.findOne({
        where: {
          alumnoId: alumno.id,
          asignaturaId: asignaturaId,
          fecha: fecha
        }
      });

      if (!asistencia) {
        // Si no hay registro de asistencia, registra una ausencia
        await Ausencia.create({
          alumnoId: alumno.id,
          asignaturaId: asignaturaId,
          fecha: fecha
        });
      }
    }
  } catch (error) {
    console.error('Error registrando ausencias:', error);
  }
}

const asistenciaController = {
  async create(req, res) {
    try {
      const asistencia = await Asistencia.create(req.body);
      io.emit('asistenciaRegistrada', { alumnoId: req.body.alumnoId, asistenciaId: asistencia.id });
      res.status(201).send(asistencia);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getAll(req, res) {
    try {
      const asistencias = await Asistencia.findAll();
      res.status(200).send(asistencias);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getById(req, res) {
    try {
      const asistencia = await Asistencia.findByPk(req.params.id);
      if (!asistencia) {
        return res.status(404).send({ message: 'Asistencia no encontrado' });
      }
      res.status(200).send(asistencia);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getAsistenciaAsignaturaAlumno(req, res) {
    try {
      // Obtener el ID del alumno desde los parámetros de la solicitud
      const { alumnoId, asignaturaId } = req.params;

      const asignaturaActualId = asignaturaId;

      // Busca en la base de datos si existe ya un registro de asistencia para este alumno y asignatura en este día
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);

      const asistencia = await Asistencia.findOne({
        where: {
          alumnoId: alumnoId,
          asignaturaId: asignaturaActualId,
          fecha: {
            [Op.gte]: fechaHoy
          }
        }
      });

      if (!asistencia) {
        return res.status(404).send({ message: 'Asistencia no encontrada para el alumno en la asignatura actual' });
      }

      res.status(200).send(asistencia);
    } catch (error) {
      console.error('Error al buscar la asistencia:', error);
      res.status(500).send({ message: 'Error al buscar la asistencia', error: error });
    }
  },

  async getFaltasAlumno(req, res) {
    try {
      const { alumnoId, asignaturaId } = req.params;

      const faltas = await Ausencia.findAll({
        where: {
          alumnoId: alumnoId,
          asignaturaId: asignaturaId
        },
        include: [{
          model: Asignatura,
          attributes: ['nombre', 'id'],
        }]
      });

      if (!faltas) {
        return res.status(404).send({ message: 'Faltas no encontradas' });
      }

      res.status(200).send(faltas);
    } catch (error) {
      console.error('Error al buscar las faltas:', error);
      res.status(500).send({ message: 'Error al buscar las faltas', error: error });
    }
  },

  async getTodasFaltas(req, res) {
    try {
      const asignaturaId = req.params.asignaturaId;

      const faltas = await Ausencia.findAll({
        where: {asignaturaId: asignaturaId},
        attributes: [
          [Sequelize.fn('COUNT', '*'), 'totalFaltas'],
          'Alumno.nombreCompleto', 'Alumno.id'
        ],
        include: [{
          model: Alumno,
          attributes: [],
        }],
        group: ['alumnoId'],
        raw: true
      });

      if (!faltas || faltas.length === 0) {
        return res.status(404).send({ message: 'Faltas no encontradas' });
      }

      res.status(200).send(faltas);
    } catch (error) {
      console.error('Error al buscar las faltas:', error);
      res.status(500).send({ message: 'Error al buscar las faltas', error: error });
    }
  },

  async getTodasFaltasAlumno(req, res) {
    try {
      const role = req.user.role;
      if (role != "alumno") {
        console.error(`No eres alumno: $`);
        return res.status(400).send("No eres alumno");
      }

      const alumnoId = req.user.userId;

      const faltas = await Ausencia.findAll({
        where: {alumnoId: alumnoId},
        include: [{
          model: Asignatura,
          attributes: ['nombre', 'id'],
        }]
      });

      if (!faltas || faltas.length === 0) {
        return res.status(404).send({ message: 'Faltas no encontradas' });
      }

      res.status(200).send(faltas);
    } catch (error) {
      console.error('Error al buscar las faltas:', error);
      res.status(500).send({ message: 'Error al buscar las faltas', error: error });
    }
  },

  async update(req, res) {
    try {
      const [updated] = await Asistencia.update(req.body, {
        where: { id: req.params.id }
      });
      if (updated) {
        const updatedAsistencia = await Asistencia.findByPk(req.params.id);
        res.status(200).send(updatedAsistencia);
      } else {
        res.status(404).send({ message: 'Asistencia no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Asistencia.destroy({
        where: { id: req.params.id }
      });
      if (deleted) {
        res.status(204).send({ message: 'Asistencia eliminado' });
      } else {
        res.status(404).send({ message: 'Asistencia no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
};

module.exports = {
  asistenciaController,
  registrarAusencias
};
