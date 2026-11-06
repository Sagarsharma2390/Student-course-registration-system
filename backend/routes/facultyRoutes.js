const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');

router.get('/', facultyController.getAllFaculty);
router.post('/', facultyController.addFaculty);

module.exports = router;

