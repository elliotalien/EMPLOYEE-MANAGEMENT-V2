const express = require('express');
const router = express.Router();
const employeeController = require('../controller/employee.controller');
const upload = require('../middleware/upload');
const isAuthenticated = require("../middleware/auth");

// Employee CRUD routes
router.post('/', isAuthenticated, upload.single('image'), employeeController.create);
router.get('/', isAuthenticated, employeeController.find);
router.get('/:id', isAuthenticated, employeeController.findOne);
router.put('/:id', isAuthenticated, upload.single('image'), employeeController.update);
router.delete('/:id', isAuthenticated, employeeController.delete);

// Employee search route
router.get('/search/:query', isAuthenticated, employeeController.search);

module.exports = router;
