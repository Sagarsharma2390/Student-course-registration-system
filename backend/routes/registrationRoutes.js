const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');

router.get('/', registrationController.getAllRegistrations);
router.get('/student/:studentId', registrationController.getStudentRegistrations);
router.post('/', registrationController.registerCourse);
router.put('/:id/cancel', registrationController.cancelRegistration);
router.put('/:id/status', registrationController.updateStatus);

module.exports = router;

