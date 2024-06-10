// controllers/horarioController.js
const { Horario, Asignatura, Alumno } = require('../models');
const { Op, where } = require('sequelize');
const {AlumnoAsignatura} = require('../models');

async function obtenerAsignaturaActualProfesor(profesorId) {
  try {
    const ahora = new Date();
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaDeLaSemana = ahora.getDay();
    const nombreDiaDeLaSemana = dias[diaDeLaSemana];

    const horaActual = ahora.toTimeString().split(' ')[0];

    console.log('profesorid', profesorId);

    const horario = await Horario.findOne({
      where: {
        horaInicio: {
          [Op.lte]: horaActual,
        },
        horaFin: {
          [Op.gte]: horaActual,
        },
        diaDeLaSemana : {
          [Op.like]: nombreDiaDeLaSemana
        },
      },
      include: [{
        model: Asignatura,
        where: {profesorId: profesorId},
        attributes: ['nombre', 'id'],
      }]
    });

    if (!horario) {
      // return await res.status(404).send({ message: 'Asignatura no encontrada' });
      console.error('Asignatura no encontrada');
    }

    return await horario;
  } catch (error) {
    console.error('Error al obtener el horario por hhhhhora:', error);
    return await res.status(404).send({ message: 'Asignatura no encontrada' });;
  }
}

async function obtenerAsignaturaActualAlumno(alumnoId) {
  try {
    const ahora = new Date();
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaDeLaSemana = ahora.getDay();
    const nombreDiaDeLaSemana = dias[diaDeLaSemana];
    const horaActual = ahora.toTimeString().split(' ')[0];

    const horario = await Horario.findOne({
      where: {
        horaInicio: { [Op.lte]: horaActual },
        horaFin: { [Op.gte]: horaActual },
        diaDeLaSemana: { [Op.like]: nombreDiaDeLaSemana }
      },
      include: [{
        model: Asignatura,
        attributes: ['nombre', 'id'],
        required: true, // Asegura que los Horarios tienen una Asignatura asociada
        include: [{
          model: Alumno,
          required: true, // Asegura que los Horarios se filtran por aquellos que tienen una relación con Alumno
          through: {
            model: AlumnoAsignatura,
            where: { alumnoId: alumnoId },
            attributes: []
          },
          attributes: []
        }]
      }]
    });

    if (!horario) {
      console.error('Asignatura no encontrada');
      return null; // Ajuste para retornar null si no se encuentra
    }

    return horario;
  } catch (error) {
    console.error('Error al obtener el horario por horaaa:', error);
    throw new Error("Error al procesar la solicitud"); // Lanzar un error o manejar adecuadamente
  }
}

async function findAsignaturaProxima(alumnoId) {
  try {
    const ahora = new Date();
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    let diaDeLaSemana = ahora.getDay(); // Obtiene el día de la semana actual
    const horaActual = ahora.toTimeString().split(' ')[0]; // Obtiene la hora actual

    let horario = null;

    // Intenta encontrar la siguiente asignatura en el mismo día para el alumno especificado
    horario = await Horario.findOne({
      where: {
        horaInicio: { [Op.gt]: horaActual },
        diaDeLaSemana: dias[diaDeLaSemana]
      },
      order: [['horaInicio', 'ASC']],
      include: [{
        model: Asignatura,
        attributes: ['nombre', 'id'],
        include: [{
          model: Alumno,
          where: { id: alumnoId },
          attributes: [],
          through: {
            attributes: []
          }
        }]
      }]
    });

    // Si no hay más asignaturas hoy para este alumno, busca la primera asignatura del próximo día con clases
    let intentos = 0;
    while (!horario && intentos < 7) { // Se asegura de no iterar indefinidamente
      diaDeLaSemana = (diaDeLaSemana + 1) % 7; // Avanza al siguiente día de la semana
      horario = await Horario.findOne({
        where: {
          diaDeLaSemana: dias[diaDeLaSemana]
        },
        order: [['horaInicio', 'ASC']],
        include: [{
          model: Asignatura,
          attributes: ['nombre', 'id'],
          include: [{
            model: Alumno,
            where: { id: alumnoId },
            attributes: [],
            through: {
              attributes: []
            }
          }]
        }]
      });
      intentos++;
    }

    if (!horario) {
      return 'Siguiente asignatura no encontrada';
    }

    return horario;
  } catch (error) {
    console.error('Error al obtener la siguiente asignatura:', error);
    return 'Error al buscar la siguiente asignatura';
  }
}

const horarioController = {
  async create(req, res) {
    try {
      const horario = await Horario.create(req.body);
      res.status(201).send(horario);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getAll(req, res) {
    try {
      const alumnoId = req.user.userId;
  
      const horarios = await Horario.findAll({
        include: [{
          model: Asignatura,
          attributes: ['nombre'],
          required: true,  // Asegura que sólo se incluyen Horarios con una Asignatura asociada
          include: [{
            model: Alumno,
            where: { id: alumnoId },
            attributes: [],
            through: {
              attributes: []
            },
            required: true  // Asegura que la Asignatura tenga este Alumno específico
          }]
        }]
      });
  
      if (!horarios || horarios.length === 0) {
        console.error('No se encontraron horarios');
        return res.status(404).send('No se encontraron horarios asociados con el alumno');
      }
  
      res.status(200).send(horarios);
    } catch (error) {
      console.error('Este es el error', error);
      res.status(500).send(error);
    }
  },  

  async getById(req, res) {
    try {
      const horario = await Horario.findByPk(req.params.id);
      if (!horario) {
        return res.status(404).send({ message: 'Horario no encontrado' });
      }
      res.status(200).send(horario);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async asignaturaActualProfesor(req, res) {
    try {
      const role = req.user.role;
      if (role != "profesor") {
        console.error(`No eres profesor: $`);
        return res.status(400).send("No eres profesor");
      }

      const profesorId = req.user.userId;

      const horario = await obtenerAsignaturaActualProfesor(profesorId);

      if (!horario) {
        return res.status(404).send({ message: 'Asignatura no encontrada' });
      }

      res.status(200).send(horario);
    } catch (error) {
      console.error('Asignatura no encontrada', error);
      res.status(404).send({ message: 'Asignatura no encontrada' });
    }
  },

  async asignaturaActualAlumno(req, res) {
    try {
      const alumnoId = req.user.userId;
      const horario = await obtenerAsignaturaActualAlumno(alumnoId);

      if (!horario) {
        return res.status(404).send({ message: 'Asignatura no encontrada' });
      }

      res.status(200).send(horario);
    } catch (error) {
      console.error(`Este es el mensaje de error ${error}`);
      res.status(404).send({ message: 'Asignatura no encontrada' });
    }
  },

  async getAsignaturaProxima(req, res){
    try {
      const alumnoId = req.user.userId;
      const horario = await findAsignaturaProxima(alumnoId);

      if (!horario) {
        return res.status(404).send({ message: 'Asignatura no encontrada' });
      }

      res.status(200).send(horario);
    } catch (error) {
      res.status(404).send({ message: 'Asignatura no encontrada' });
    }
  },

  async update(req, res) {
    try {
      const [updated] = await Horario.update(req.body, {
        where: { id: req.params.id }
      });
      if (updated) {
        const updatedHorario = await Horario.findByPk(req.params.id);
        res.status(200).send(updatedHorario);
      } else {
        res.status(404).send({ message: 'Horario no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Horario.destroy({
        where: { id: req.params.id }
      });
      if (deleted) {
        res.status(204).send({ message: 'Horario eliminado' });
      } else {
        res.status(404).send({ message: 'Horario no encontrado' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
};

module.exports = {
  horarioController, 
  obtenerAsignaturaActualProfesor
};
