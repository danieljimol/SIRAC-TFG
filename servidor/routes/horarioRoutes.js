const express = require('express');
const {horarioController} = require('../controllers/horarioController');
const router = express.Router();

router.post('/', horarioController.create); // Crear un nuevo horario
router.get('/', horarioController.getAll); // Obtener todos los horarios
router.get('/asignaturaActual/profesor', horarioController.asignaturaActualProfesor); // Obtener la asignatura actual del profesor
router.get('/asignaturaActual/alumno', horarioController.asignaturaActualAlumno); // Obtener la asignatura actual del alumno
router.get('/asignaturaProxima', horarioController.getAsignaturaProxima); // Obtener la asignatura próxima
router.get('/:id', horarioController.getById); // Obtener un horario por ID
router.put('/:id', horarioController.update); // Actualizar un horario
router.delete('/:id', horarioController.delete); // Eliminar un horario

module.exports = router;
