// controllers/alumnoController.js
const { obtenerAsignaturaActualProfesor } = require('./horarioController');
const { Alumno, Asistencia, Asignatura, Horario, AlumnoAsignatura, Profesor } = require('../models');
const { Op, where } = require('sequelize');
const asignatura = require('../models/asignatura');

async function findAlumnoByEmail(email) {
  return await Alumno.findOne({
    where: { correo: email }
  });
}

async function findAlumnoByUUIDBLE(uuidBLE) {
  return await Alumno.findOne({
    where: { uuidBLE: uuidBLE }
  });
}

async function createAlumno(alumnoData) {
  console.log("Entro aquí das ");
  return await Alumno.create(alumnoData);
}

const alumnoController = {
  async create(req, res) {
    try {
      const alumno = await Alumno.create(req.body);
      res.status(201).send(alumno);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async unirseClase(req, res) {
    try {
      const role = req.user.role;
      if (role != "alumno") {
        console.error(`No eres alumno: $`);
        return res.status(400).send("No eres alumno");
      }

      const codigoClase = req.body.codigoClase;

      const asignatura = await Asignatura.findOne({
        where: {
          codigo: codigoClase
        }
      });

      if (asignatura == null) {
        console.log("No hemos encontrado ninguna asignatura con ese código");
        return res.status(400).send("Código incorrecto");
      }

      console.log("ESTO ES LO QUE VOY A METER " + req.user.userId + " " + asignatura.id);

      const data = {
        alumnoId: req.user.userId,
        asignaturaId: asignatura.id
      }

      const alumnoAsignatura = await AlumnoAsignatura.create(data);
      res.status(201).send(alumnoAsignatura);
    } catch (error) {
      console.error(`Error al unirse a clase ${error}`);
      res.status(400).send(error);
    }
  },

  async salirseClase(req, res) {
    try {
      const role = req.user.role;
      if (role !== "alumno") {
        console.error(`No eres alumno: ${role}`);
        return res.status(400).send("No eres alumno");
      }
  
      const alumnoId = req.user.userId;
      const asignaturaId = req.params.asignaturaId;
  
      const asignatura = await AlumnoAsignatura.destroy({
        where: {
          asignaturaId: asignaturaId,
          alumnoId: alumnoId
        }
      });
  
      if (asignatura === 0) { // `destroy` returns the number of affected rows, not `null` or an object
        console.log("No hemos encontrado ninguna asignatura");
        return res.status(400).send("Código incorrecto");
      }
  
      res.status(200).send("Asignatura eliminada correctamente"); // Asegúrate de enviar una respuesta
    } catch (error) {
      console.error(`Error al salirse a clase ${error}`);
      res.status(400).send(error);
    }
  },  

  async getAll(req, res) {
    try {
      const role = req.user.role;
      if (role != "profesor") {
        console.error(`No eres profesor: $`);
        return res.status(400).send("No eres profesor");
      }

      const profesorId = req.user.userId;
      const asignaturaId = req.params.asignaturaId;

      console.log(`AsignaturaId que me llegaaaa ${asignaturaId}`);

      const alumnos = await Alumno.findAll({
        include: [{
          model: Asignatura,
          required: true,
          include: [{
            model: Profesor,
            where: { id: profesorId },
            required: true
          }],
          through: {
            model: AlumnoAsignatura,
            where: {asignaturaId: asignaturaId},
            attributes: []
          }
        }]
      });

      if (alumnos.length === 0) {
        console.log("No se encontraron alumnos para las asignaturas que imparte");
        return res.status(404).send('No se encontraron alumnos para las asignaturas que imparte');
      }

      res.status(200).send(alumnos);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  },

  // Método que devulve todos los alumnos NO registrados en la asignatura actual
  async obtenerTodosLosNoRegistrados(req, res) {
    try {
      const role = req.user.role;
      if (role != "profesor") {
        console.error(`No eres profesor: $`);
        return res.status(400).send("No eres profesor");
      }

      const profesorId = req.user.userId;

      // Asignatura actual
      const asignaturaActual = await obtenerAsignaturaActualProfesor(profesorId);

      if (!asignaturaActual) {
        return res.status(404).send({ message: 'No hay una asignatura actualmente en curso.' });
      }

      // Asignatura actual id
      const asignaturaActualId = asignaturaActual.asignaturaId;

      console.log("ASIGNATURA ACTUAL ID " + asignaturaActualId);

      // Ahora encuentra todos los alumnos que no han registrado asistencia en esta asignatura hoy
      const fechaCompletaHoy = new Date();
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);

      console.log("FECHA HOY " + fechaHoy);

      const alumnosRegistradosHoy = await Asistencia.findAll({
        where: {
          asignaturaId: asignaturaActualId,
          fecha: {
            [Op.lte]: fechaCompletaHoy,
            [Op.gt]: fechaHoy
          }
        },
        attributes: ['alumnoId']
      });

      const alumnosRegistradosHoyIds = alumnosRegistradosHoy.map(a => a.alumnoId);

      const alumnosNoRegistrados = await Alumno.findAll({
        where: {
          id: { [Op.notIn]: alumnosRegistradosHoyIds }
        }
      });

      res.status(200).send(alumnosNoRegistrados);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  // Método que devulve todos los alumnos registrados en la asignatura actual
  async obtenerTodosLosRegistrados(req, res) {
    try {
      const role = req.user.role;
      if (role != "profesor") {
        console.error(`No eres profesor: $`);
        return res.status(400).send("No eres profesor");
      }

      const profesorId = req.user.userId;

      // Asignatura actual
      const asignaturaActual = await obtenerAsignaturaActualProfesor(profesorId);

      if (!asignaturaActual) {
        return res.status(404).send({ message: 'No hay una asignatura actualmente en curso.' });
      }

      // Asignatura actual id
      const asignaturaActualId = asignaturaActual.asignaturaId;

      // Ahora encuentra todos los alumnos que ya han registrado asistencia en esta asignatura hoy
      const fechaCompletaHoy = new Date();
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);

      console.log("FECHA HOY " + fechaHoy);

      const alumnosRegistradosHoy = await Asistencia.findAll({
        where: {
          asignaturaId: asignaturaActualId,
          fecha: {
            [Op.lte]: fechaCompletaHoy,
            [Op.gt]: fechaHoy
          }
        },
        attributes: ['alumnoId']
      });

      const alumnosRegistradosHoyIds = alumnosRegistradosHoy.map(a => a.alumnoId);

      const alumnosRegistrados = await Alumno.findAll({
        where: {
          id: { [Op.in]: alumnosRegistradosHoyIds }
        }
      });

      res.status(200).send(alumnosRegistrados);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  },

  async getById(req, res) {
    try {
      const alumno = await Alumno.findByPk(req.params.id);
      if (!alumno) {
        return res.status(404).send({ message: 'Alumno no encontrado' });
      }
      res.status(200).send(alumno);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async update(req, res) {
    try {
      const [updated] = await Alumno.update(req.body, {
        where: { id: req.params.id }
      });
      if (updated) {
        const updatedAlumno = await Alumno.findByPk(req.params.id);
        res.status(200).send(updatedAlumno);
      } else {
        res.status(404).send({ message: 'Alumno no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Alumno.destroy({
        where: { id: req.params.id }
      });
      if (deleted) {
        res.status(204).send({ message: 'Alumno eliminado' });
      } else {
        res.status(404).send({ message: 'Alumno no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getByEmail(req, res) {
    console.log(req.params.email);
    try {
      const alumno = await findAlumnoByEmail(req.params.email);
      if (!alumno) {
        return res.status(404).send({ message: 'Alumno no encontrado' });
      }
      res.status(200).send(alumno);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getByUUIDBLE(req, res) {
    console.log('UUIDBLE ' + req.params.uuidBLE);
    try {
      const alumno = await findAlumnoByUUIDBLE(req.params.uuidBLE);
      if (!alumno) {
        return res.status(404).send({ message: 'Alumno no encontrado' });
      }
      res.status(200).send(alumno);
    } catch (error) {
      res.status(500).send(error);
    }
  }
};

module.exports = {
  alumnoController,
  findAlumnoByEmail,
  createAlumno
};
