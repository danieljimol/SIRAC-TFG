const express = require('express');
const { asistenciaController } = require('../controllers/asistenciaController');
const router = express.Router();

router.post('/', asistenciaController.create); // Crear un nuevo asistencia
router.get('/', asistenciaController.getAll); // Obtener todos los asistencias
router.get('/asistenciaAsignaturaAlumno/:alumnoId/:asignaturaId', asistenciaController.getAsistenciaAsignaturaAlumno);
router.get('/faltas/:alumnoId/:asignaturaId', asistenciaController.getFaltasAlumno);
router.get('/faltas/:asignaturaId', asistenciaController.getTodasFaltas);
router.get('/faltas/alumno/todas/faltas', asistenciaController.getTodasFaltasAlumno);
router.get('/:id', asistenciaController.getById); // Obtener un asistencia por ID
router.put('/:id', asistenciaController.update); // Actualizar un asistencia
router.delete('/:id', asistenciaController.delete); // Eliminar un asistencia

module.exports = router;
