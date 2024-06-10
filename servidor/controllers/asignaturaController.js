// controllers/asignaturaController.js
const { where } = require('sequelize');
const { Asignatura, Horario, sequelize, Alumno, AlumnoAsignatura } = require('../models');
const crypto = require('crypto');

function generateAlphanumericCode(length) {
  // Definir los caracteres posibles
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    // Generar un valor aleatorio seguro
    const randomValue = crypto.randomInt(charactersLength);
    result += characters.charAt(randomValue);
  }
  return result;
}

const asignaturaController = {
  async create(req, res) {
    const t = await sequelize.transaction();
    try {
      const role = req.user.role;
      if (role != "profesor") {
        console.error(`No eres progesor: $`);
        return res.status(400).send("No eres profesor");
      }

      const asignaturaData = {
        profesorId: req.user.userId,
        nombre: req.body.nombreAsignatura,
        codigo: generateAlphanumericCode(6)
      };

      const asignatura = await Asignatura.create(asignaturaData, { transaction: t });

      console.log(`Este es el id de la asignatura recién creada ${asignatura.id}`);

      const horarios = req.body.horarios;
      for (const horario of horarios) {
        let horasInicio = new Date(horario.horaInicio).getHours();
        let minutosInicio = new Date(horario.horaInicio).getMinutes();

        // Si quieres mostrarlo como un string en formato "HH:MM"
        let horarioInicio = horasInicio.toString().padStart(2, '0') + ':' + minutosInicio.toString().padStart(2, '0');

        let horasFin = new Date(horario.horaFin).getHours();
        let minutosFin = new Date(horario.horaFin).getMinutes();

        // Si quieres mostrarlo como un string en formato "HH:MM"
        let horarioFin = horasFin.toString().padStart(2, '0') + ':' + minutosFin.toString().padStart(2, '0');

        const horarioData = {
          asignaturaId: asignatura.id,
          diaDeLaSemana: horario.dia,
          horaInicio: horarioInicio,
          horaFin: horarioFin
        };

        await Horario.create(horarioData, { transaction: t });
      }

      await t.commit();
      res.status(201).send(asignatura);
    } catch (error) {
      await t.rollback();
      console.error('Error al crear la asignatura y sus horarios:', error);
      res.status(400).send(error.message || error);
    }
  },
  
  async getAll(req, res) {
    try {
      req.user.role == "profesor" && (profesorId = req.user.userId);
      const asignaturas = await Asignatura.findAll({
        where: {
          profesorId: profesorId
        }
      });
      res.status(200).send(asignaturas);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getAllProfesor(req, res) {
    try {
      req.user.role == "profesor" && (profesorId = req.user.userId);
      const asignaturas = await Asignatura.findAll({
        where: {
          profesorId: profesorId
        }
      });
      res.status(200).send(asignaturas);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getAllAlumno(req, res) {
    try {
      const role = req.user.role;
      if (role != "alumno") {
        console.error("No eres alumno");
        return res.status(400).send("No eres alumno");
      }
  
      const alumnoId = req.user.userId;
  
      const asignaturas = await Asignatura.findAll({
        include: [{
          model: Alumno,
          as: 'Alumnos',
          attributes: [],
          through: {
            model: AlumnoAsignatura,
            attributes: [],
            where: { alumnoId: alumnoId }
          },
          required: true
        }]
      });
      res.status(200).send(asignaturas);
    } catch (error) {
      console.error("Error al obtener las asignaturas del alumno:", error);
      res.status(500).send(error);
    }
  },  

  async getById(req, res) {
    try {
      const asignatura = await Asignatura.findByPk(req.params.id, {
        include: [{
          model: Horario,
          where: { asignaturaId: req.params.id },
          required: false
        }]
      });
      
      if (!asignatura) {
        return res.status(404).send({ message: 'Asignatura no encontrada' });
      }
      
      res.status(200).send(asignatura);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async update(req, res) {
    const t = await sequelize.transaction();
    try {
      const { nombreAsignatura, horarios } = req.body;

      const [updated] = await Asignatura.update(
        { nombre: nombreAsignatura },
        { where: { id: req.params.id }, transaction: t }
      );

      if (!updated) {
        return res.status(404).send({ message: 'Asignatura no encontrada' });
      }

      // Actualizar horarios: eliminar los existentes y agregar los nuevos
      await Horario.destroy({ where: { asignaturaId: req.params.id }, transaction: t });

      for (const horario of horarios) {
        let horasInicio = new Date(horario.horaInicio).getHours();
        let minutosInicio = new Date(horario.horaInicio).getMinutes();

        let horarioInicio = horasInicio.toString().padStart(2, '0') + ':' + minutosInicio.toString().padStart(2, '0');

        let horasFin = new Date(horario.horaFin).getHours();
        let minutosFin = new Date(horario.horaFin).getMinutes();

        let horarioFin = horasFin.toString().padStart(2, '0') + ':' + minutosFin.toString().padStart(2, '0');

        console.log(`Horario inicio ${horarioInicio}, Horario fin ${horarioFin}`);

        const horarioData = {
          asignaturaId: req.params.id,
          diaDeLaSemana: horario.dia,
          horaInicio: horarioInicio,
          horaFin: horarioFin
        };

        await Horario.create(horarioData, { transaction: t });
      }

      await t.commit();

      const updatedAsignatura = await Asignatura.findByPk(req.params.id, {
        include: [{ model: Horario }],
      });

      res.status(200).send(updatedAsignatura);
    } catch (error) {
      await t.rollback();
      console.error('Error al actualizar la asignatura y sus horarios:', error);
      res.status(500).send(error.message || error);
    }
  },

  async delete(req, res) {
    const t = await sequelize.transaction();
    try {
      const asignaturaId = req.params.id;

      // Eliminar registros de AlumnoAsignatura
      await AlumnoAsignatura.destroy({
        where: { asignaturaId: asignaturaId },
        transaction: t
      });

      // Eliminar registros de Horario
      await Horario.destroy({
        where: { asignaturaId: asignaturaId },
        transaction: t
      });

      // Eliminar la asignatura
      const deleted = await Asignatura.destroy({
        where: { id: asignaturaId },
        transaction: t
      });

      if (deleted) {
        await t.commit();
        res.status(204).send({ message: 'Asignatura eliminada' });
      } else {
        await t.rollback();
        res.status(404).send({ message: 'Asignatura no encontrada' });
      }
    } catch (error) {
      await t.rollback();
      console.error('Error al eliminar la asignatura y sus registros asociados:', error);
      res.status(500).send(error.message || error);
    }
  }
};

module.exports = asignaturaController;
