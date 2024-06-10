const express = require('express');
const {alumnoController} = require('../controllers/alumnoController');
const router = express.Router();

router.post('/', alumnoController.create); // Crear un nuevo alumno
router.post('/unirseClase', alumnoController.unirseClase); // Crear un nuevo alumno
router.get('/salirseClase/:asignaturaId', alumnoController.salirseClase); // Crear un nuevo alumno
router.get('/obtenerTodosLosAlumnos/:asignaturaId', alumnoController.getAll); // Obtener todos los alumnos
router.get('/uuidble/:uuidBLE', alumnoController.getByUUIDBLE);
router.get('/email/:email', alumnoController.getByEmail);
router.get('/id/:id', alumnoController.getById); // Obtener un alumno por ID
router.get('/obtenerTodosLosRegistrados/', alumnoController.obtenerTodosLosRegistrados);
router.get('/obtenerTodosLosNoRegistrados/', alumnoController.obtenerTodosLosNoRegistrados);
router.put('/:id', alumnoController.update); // Actualizar un alumno
router.delete('/:id', alumnoController.delete); // Eliminar un alumno

module.exports = router;
