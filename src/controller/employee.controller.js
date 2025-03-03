const employeeService = require("../services/employee.service");
const { handleError } = require("../utils/error-handler");
const Employee = require("../model/employee.model");

exports.create = async (req, res) => {
    try {
        const employeeData = {
            ...req.body,
            createdBy: req.session.userId
        };
        const result = await employeeService.createEmployee(employeeData, req.file);
        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: result
        });
    } catch (error) {
        handleError(res, error);
    }
};

exports.find = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        // Get the current user's ID from the session
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const result = await employeeService.searchEmployee(search, page, limit, userId);
        
        res.json({
            success: true,
            data: result.search,
            pagination: {
                currentPage: page,
                totalPages: result.totalPages,
                totalItems: result.totalCount
            }
        });
    } catch (error) {
        console.error('Find employees error:', error);
        handleError(res, error);
    }
};

exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required"
            });
        }

        const result = await employeeService.findById(id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Find employee error:', error);
        handleError(res, error);
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        const result = await employeeService.updateEmployee(id, req.body, req.file);
        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Update employee error:', error);
        handleError(res, error);
    }
};

exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        await employeeService.deleteEmployee(id);

        // Get updated list of employees after deletion
        const page = 1;  // Reset to first page after deletion
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const userId = req.session.userId;

        const updatedResult = await employeeService.searchEmployee(search, page, limit, userId);
        
        res.json({
            success: true,
            message: 'Employee deleted successfully',
            data: updatedResult.search,
            pagination: {
                currentPage: page,
                totalPages: updatedResult.totalPages,
                totalItems: updatedResult.totalCount
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

// View Employee Details
exports.ViewEmployeeRoutes = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).send('Employee ID is required');
        }

        const employee = await employeeService.findById(id);
        if (!employee) {
            return res.status(404).send('Employee not found');
        }

        // Pre-generate the image URL
        const imageUrl = employee.imageUrl || employeeService.getDefaultImageUrl(employee);

        // Pass employee data and pre-generated image URL
        res.render('viewEmployee', { 
            employee,
            imageUrl,
            user: req.session.user // Pass user data for header
        });
    } catch (error) {
        console.error('View employee error:', error);
        res.status(500).send('Error viewing employee');
    }
};

exports.search = async (req, res) => {
    try {
        const result = await employeeService.searchEmployees(req.params.query);
        res.json(result);
    } catch (error) {
        handleError(res, error);
    }
};
