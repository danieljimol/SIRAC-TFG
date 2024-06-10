const express = require('express');
const asignaturaController = require('../controllers/asignaturaController');
const router = express.Router();

router.post('/', asignaturaController.create); // Crear un nuevo asignatura
router.get('/getAllProfesor', asignaturaController.getAllProfesor); // Obtener todos los asignaturas
router.get('/getAllAlumno', asignaturaController.getAllAlumno); // Obtener todos los asignaturas
router.get('/:id', asignaturaController.getById); // Obtener un asignatura por ID
router.put('/:id', asignaturaController.update); // Actualizar un asignatura
router.delete('/:id', asignaturaController.delete); // Eliminar un asignatura

module.exports = router;
