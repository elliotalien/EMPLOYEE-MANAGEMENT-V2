const Employee = require("../model/employee.model");
const { uploadToCloudinary, deleteFromCloudinary } = require("../services/cloudinary.service");
const multer = require('multer');

// CREATE EMPLOYEE
const createEmployee = async (data, file) => {
    try {
        console.log('Creating new employee with data:', data);

        // Validate all required fields including password for new employees
        const requiredFields = [
            "salutation", "firstName", "lastName", "email", "phone",
            "dob", "address", "gender", "qualifications", "state",
            "city", "country", "pinZip", "username", "password",
            "department", "status", "salary"
        ];

        const missingFields = [];
        for (const field of requiredFields) {
            const value = data[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            throw { 
                status: 400, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw { 
                status: 400, 
                message: 'Invalid email format' 
            };
        }

        // Validate phone number (10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(data.phone)) {
            throw { 
                status: 400, 
                message: 'Phone number must be 10 digits' 
            };
        }

        // Validate salary (must be a positive number)
        const salary = parseFloat(data.salary);
        if (isNaN(salary) || salary < 0) {
            throw {
                status: 400,
                message: 'Salary must be a positive number'
            };
        }

        // Upload image if provided
        let imageData = null;
        if (file) {
            try {
                imageData = await uploadToCloudinary(file.buffer, {
                    folder: 'employee_images',
                    public_id: `image_${data.username}`,
                    tags: ['employee_image', data.username]
                });
                data.imageUrl = imageData.url;
                data.imagePublicId = imageData.public_id;
            } catch (error) {
                console.error('Image upload failed:', error);
                throw { 
                    status: 400, 
                    message: 'Failed to upload image. Please try again.' 
                };
            }
        }

        // Create employee with image data
        const employee = new Employee(data);
        const savedEmployee = await employee.save();
        
        return {
            success: true,
            data: {
                ...savedEmployee.toObject(),
                image: imageData
            }
        };
    } catch (error) {
        // If employee creation fails and image was uploaded, delete it
        if (data.imagePublicId) {
            try {
                await deleteFromCloudinary(data.imagePublicId);
            } catch (cleanupError) {
                console.error('Failed to cleanup image after employee creation failed:', cleanupError);
            }
        }
        throw error;
    }
};

// UPDATE EMPLOYEE
const updateEmployee = async (id, data, file) => {
    try {
        console.log('Updating employee:', { id, data, hasFile: !!file });
        
        const employee = await Employee.findById(id);
        if (!employee) {
            throw { status: 404, message: 'Employee not found' };
        }

        // Only validate fields that are being updated
        const requiredFields = [
            "firstName", "lastName", "email", "phone",
            "department", "status", "salary"
        ];

        const missingFields = [];
        for (const field of requiredFields) {
            // Only check if the field is present in the update data
            if (field in data && (!data[field] || (typeof data[field] === 'string' && data[field].trim() === ''))) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            throw { 
                status: 400, 
                message: `Invalid values for fields: ${missingFields.join(', ')}` 
            };
        }

        // Validate email format if email is being updated
        if (data.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                throw { 
                    status: 400, 
                    message: 'Invalid email format' 
                };
            }
        }

        // Validate phone number if phone is being updated
        if (data.phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(data.phone)) {
                throw { 
                    status: 400, 
                    message: 'Phone number must be 10 digits' 
                };
            }
        }

        // Handle image update if new file is provided
        if (file && file.buffer) {
            try {
                console.log('Updating employee image');
                
                // Delete old image if it exists
                if (employee.imagePublicId) {
                    console.log('Deleting old image:', employee.imagePublicId);
                    try {
                        await deleteFromCloudinary(employee.imagePublicId);
                    } catch (deleteError) {
                        console.error('Failed to delete old image:', deleteError);
                        // Continue with update even if delete fails
                    }
                }

                // Upload new image
                console.log('Uploading new image');
                const imageData = await uploadToCloudinary(file.buffer, {
                    folder: 'employee_images',
                    public_id: `image_${employee.username}_${Date.now()}`,
                    tags: ['employee_image', employee.username]
                });

                console.log('Image upload successful:', imageData);
                data.imageUrl = imageData.url;
                data.imagePublicId = imageData.public_id;
            } catch (error) {
                console.error('Image update failed:', error);
                throw { 
                    status: 400, 
                    message: 'Failed to update image. Please try again.' 
                };
            }
        }

        // Update employee with new data
        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );

        return {
            success: true,
            data: updatedEmployee
        };
    } catch (error) {
        throw error;
    }
};

// FIND ALL EMPLOYEES
const findAll = async () => {
    try {
        const employees = await Employee.find().select('+password');
        return employees;
    } catch (error) {
        throw {
            status: 500,
            message: error.message || 'Error retrieving employees'
        };
    }
};

// FIND SINGLE EMPLOYEE
const findById = async (id) => {
    try {
        const employee = await Employee.findById(id).select('+password');
        if (!employee) {
            throw {
                status: 404,
                message: 'Employee not found'
            };
        }
        return employee;
    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || 'Error retrieving employee'
        };
    }
};

// DELETE EMPLOYEE
const deleteEmployee = async (id) => {
    try {
        const employee = await Employee.findById(id);
        if (!employee) {
            throw { status: 404, message: 'Employee not found' };
        }

        // Delete image from Cloudinary if it exists
        if (employee.imagePublicId) {
            try {
                await deleteFromCloudinary(employee.imagePublicId);
            } catch (error) {
                console.error('Failed to delete image:', error);
                // Continue with employee deletion even if image deletion fails
            }
        }

        await Employee.findByIdAndDelete(id);
        return { message: 'Employee deleted successfully' };
    } catch (error) {
        throw handleError(error);
    }
};

const handleError = (error) => {
    if (error instanceof multer.MulterError) {
        return { status: 400, message: "Image upload error" };
    } else if (error.name === 'ValidationError') {
        return { status: 400, message: error.message };
    } else {
        return { status: 500, message: error.message || "Server error" };
    }
};

// search and pagination
const searchEmployee = async (searchKey = '', page = 1, limit = 10, userId) => {
    try {
        const query = {
            createdBy: userId,
            $or: [
                { firstName: { $regex: searchKey, $options: 'i' } },
                { lastName: { $regex: searchKey, $options: 'i' } },
                { email: { $regex: searchKey, $options: 'i' } },
                { phone: { $regex: searchKey, $options: 'i' } }
            ]
        };

        const totalCount = await Employee.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;

        const search = await Employee.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return {
            search,
            totalPages,
            totalCount
        };
    } catch (error) {
        throw error;
    }
};

// Get default image URL for an employee
const getDefaultImageUrl = (employee) => {
    if (!employee || !employee.firstName) return '';
    
    const firstLetter = employee.firstName.charAt(0).toUpperCase();
    const colors = [
        '2196F3', // Blue
        '4CAF50', // Green
        'E91E63', // Pink
        'FF9800', // Orange
        '9C27B0', // Purple
        '00BCD4'  // Cyan
    ];
    
    // Use a consistent color for the same letter
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Create URL for UI Avatars API
    const params = new URLSearchParams({
        name: firstLetter,
        background: backgroundColor,
        color: 'fff',
        size: '256',
        bold: 'true',
        'font-size': '0.6'
    });
    
    return `https://ui-avatars.com/api/?${params.toString()}`;
};

module.exports = { 
    createEmployee,
    findAll,
    findById,
    updateEmployee,
    deleteEmployee,
    searchEmployee,
    getDefaultImageUrl,
    handleError
};
