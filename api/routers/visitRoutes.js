const express = require('express');
const { protect } = require('../middleware/auth');
const { validateVisitCreation, validateVisitUpdate } = require('../middleware/validation');
const visitController = require('../controllers/visitController');

const router = express.Router();

router.use(protect);

router.post('/', validateVisitCreation, visitController.createVisit);
router.get('/', visitController.listVisits);
router.get('/:id', visitController.getVisitById);
router.patch('/:id', validateVisitUpdate, visitController.updateVisit);
router.delete('/:id', visitController.deleteVisit);

module.exports = router;
