const express = require('express');
const { profesorController } = require('../controllers/profesorController');
const router = express.Router();

router.post('/', profesorController.create); // Crear un nuevo profesor
router.get('/', profesorController.getAll); // Obtener todos los profesors
router.get('/:id', profesorController.getById); // Obtener un profesor por ID
router.put('/:id', profesorController.update); // Actualizar un profesor
router.delete('/:id', profesorController.delete); // Eliminar un profesor

module.exports = router;
