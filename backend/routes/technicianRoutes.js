const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, technicianController.getAllTechnicians);
router.post('/', auth, technicianController.createTechnician);
router.get('/active', auth, technicianController.getActiveTechnicians);
router.get('/specialization/:spec', auth, technicianController.getBySpecialization);
router.get('/:id', auth, technicianController.getTechnicianById);
router.put('/:id', auth, technicianController.updateTechnician);
router.delete('/:id', auth, technicianController.deleteTechnician);

module.exports = router;
