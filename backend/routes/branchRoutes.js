const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, branchController.getAllBranches);
router.post('/', auth, branchController.createBranch);
router.put('/:id', auth, branchController.updateBranch);
router.delete('/:id', auth, branchController.deleteBranch);
router.get('/reports/consolidated', auth, branchController.getConsolidatedReports);

module.exports = router;
