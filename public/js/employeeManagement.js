

function createToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

function showToast(type, title, message, duration = 3000) {
    createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info'
    };

    toast.innerHTML = `
        <i class="toast-icon fa-solid ${iconMap[type]}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <i class="toast-close fa-solid fa-xmark"></i>
    `;

    // Add click handler for close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentElement) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, duration);

    toastContainer.appendChild(toast);
}

function toggleMenu() {
    const nav = document.getElementById('leftSideNav');
    nav.classList.toggle('hidden');
}

function toggleSidebox(button) {
    const sidebox = button.nextElementSibling;
    
    // Hide any other visible sideboxes
    const allSideboxes = document.querySelectorAll('#sidebox');
    allSideboxes.forEach(box => {
        if (box !== sidebox) {
            box.classList.add('hidden');
        }
    });
    
    // Toggle current sidebox only
    sidebox.classList.toggle('hidden');
}

function closeAllModals() {
    // Clear error messages and validation state
    clearAllErrorMessages();
    
    // Remove validation classes from all form elements
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.classList.remove('border-red-500');
        element.classList.remove('invalid');
    });
    
    // Hide form and overlay
    const formbox = document.getElementById('formbox');
    const overlay = document.getElementById('overlay');
    const deletebox = document.getElementById('deletebox');

    if (formbox) formbox.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    if (deletebox) deletebox.classList.add('hidden');

    // Reset form
    const form = document.getElementById('FormClearing');
    if (form) {
        form.reset();
        form.dataset.employeeId = '';
        
        // Remove any dynamically added fields
        const employeeIdInput = document.getElementById('employeeId');
        if (employeeIdInput) {
            employeeIdInput.remove();
        }
    }

    // Reset image preview
    const imagePreview = document.getElementById('previewimage');
    const imageUploadBox = document.getElementById('imageuploding-box');
    if (imagePreview && imageUploadBox) {
        imagePreview.classList.add('hidden');
        imageUploadBox.classList.remove('hidden');
        const imageFile = document.getElementById('imagefile');
        if (imageFile) {
            imageFile.src = '';
        }
    }
}

var selectedEmployeeId = null;

function editForm(id) {
    closeAllModals();
    const editForm = document.getElementById('formbox');
    const overlay = document.getElementById('overlay');
    const uploadBox = document.getElementById('imageuploding-box');
    const previewImage = document.getElementById('previewimage');

    // Check if all required elements exist
    if (!editForm || !overlay) {
        console.error('Required modal elements not found:', {
            formbox: Boolean(editForm),
            overlay: Boolean(overlay)
        });
        return;
    }

    // Show form and overlay
    editForm.classList.remove('hidden');
    overlay.classList.remove('hidden');

    // Handle image preview elements if they exist
    if (uploadBox && previewImage) {
        uploadBox.classList.add('hidden');
        previewImage.classList.remove('hidden');
    }

    // Call editEmployee function with the ID
    editEmployee(id);
}

function formbox() {
    const formbox = document.getElementById('formbox');
    const overlay = document.getElementById('overlay');
    const previewImage = document.getElementById('previewimage');
    const uploadBox = document.getElementById('imageuploding-box');
    const form = document.getElementById('FormClearing');
    
    // Close the form
    formbox.classList.add('hidden');
    overlay.classList.add('hidden');
    
    // Reset the form if it exists
    if (form) {
        form.reset();
        // Clear any error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.textContent = '');
    }
    
    // Reset image preview and upload box
    if (previewImage) previewImage.classList.add('hidden');
    if (uploadBox) uploadBox.classList.remove('hidden');
}

function deleteBox(id) {
    closeAllModals();
    selectedEmployeeId = id;
    const deleteBox = document.getElementById('deletebox');
    const overlay = document.getElementById('overlay');

    if (!deleteBox) {
        console.error('Delete modal not found');
        return;
    }

    deleteBox.classList.remove('hidden');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function deleteEmployee() {
    if (!selectedEmployeeId) return;

    fetch(`/api/employees/${selectedEmployeeId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        closeAllModals();
        if (data.success) {
            showToast('success', 'Success', 'Employee deleted successfully');
            // Check if we're on the view page
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/view')) {
                // Add delay before redirect to show toast
                setTimeout(() => {
                    window.location.href = '/employees';
                }, 2000); // 2 second delay
            } else {
                // Refresh the employee list for other pages
                employeeGet();
            }
        } else {
            showToast('error', 'Error', data.message || 'Failed to delete employee');
        }
    })
    .catch(error => {
        console.error('Error deleting employee:', error);
        showToast('error', 'Error', 'Failed to delete employee');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('overlay');
    
    // Add event listener for overlay click to close modal
    if (overlay) {
        overlay.addEventListener('click', function(event) {
            if (event.target === overlay) {
                closeAllModals();
            }
        });
    }

    // Add event listener for ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Add event listener for add user button
    const addUserBtn = document.getElementById('adduserbtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAddEmployeeForm();
        });
    }

    // Add event listener for close button
    const closeBtn = document.querySelector('#formbox button');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
        });
    }

    // Close sidebox when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('#sidebox') && !event.target.closest('button')) {
            const allSideboxes = document.querySelectorAll('#sidebox');
            allSideboxes.forEach(box => {
                box.classList.add('hidden');
            });
        }
    });

    // Fetch employees when page loads
    employeeGet();

    const form = document.getElementById('FormClearing');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Clear previous error messages
            clearAllErrorMessages();
            
            try {
                // Validate form
                if (!validateForm()) {
                    return;
                }

                const formData = new FormData();
                
                // Add all form fields to formData
                const formFields = [
                    'salutation', 'firstName', 'lastName', 'email', 'phone',
                    'dob', 'qualifications', 'address', 'country', 'state',
                    'city', 'pinZip', 'username', 'department', 'status', 'salary'
                ];

                formFields.forEach(field => {
                    const element = document.getElementById(field);
                    if (element) {
                        formData.append(field, element.value.trim());
                    }
                });

                // Handle password field
                const password = document.getElementById('password');
                if (password && password.value.trim()) {
                    formData.append('password', password.value.trim());
                }

                // Add gender
                const selectedGender = document.querySelector('input[name="gender"]:checked');
                if (selectedGender) {
                    formData.append('gender', selectedGender.value);
                }

                // Add image if present
                const imageInput = document.getElementById('imageuploadbox');
                if (imageInput && imageInput.files && imageInput.files[0]) {
                    formData.append('image', imageInput.files[0]);
                }

                const employeeId = document.getElementById('employeeId')?.value;
                const isEdit = !!employeeId;
                
                const url = isEdit ? `/api/employees/${employeeId}` : '/api/employees';
                const method = isEdit ? 'PUT' : 'POST';

                try {
                    const response = await fetch(url, {
                        method: method,
                        body: formData
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Operation failed');
                    }

                    const result = await response.json();
                    
                    if (!result.success) {
                        throw new Error(result.message || 'Operation failed');
                    }

                    showToast('success', 'Success', `Employee ${isEdit ? 'updated' : 'created'} successfully`);
                    closeAllModals();

                    // If we're on the view page and this is an edit, update the view
                    const viewContainer = document.querySelector('.ViewEmployeeBox');
                    if (viewContainer && isEdit) {
                        await updateViewPageDetails();
                    } else {
                        employeeGet();
                    }
                } catch (error) {
                    console.error('Operation failed:', error);
                    showToast('error', 'Error', error.message || 'Operation failed');
                }
            } catch (error) {
                console.error('Operation failed:', error);
                
                // Handle specific error cases
                if (error.message.includes('Missing required fields')) {
                    const fields = error.message.split(':')[1].trim().split(',');
                    fields.forEach(field => {
                        const fieldId = field.trim();
                        const element = document.getElementById(fieldId);
                        const errorElement = document.getElementById(`${fieldId}-error`);
                        if (element && errorElement) {
                            element.classList.add('border-red-500');
                            errorElement.textContent = `${fieldId} is required`;
                            errorElement.classList.remove('hidden');
                        }
                    });
                }
                
                showToast('error', 'Error', error.message || 'Operation failed');
            }
        });

        // Add input event listeners to clear error messages on input
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                const errorElement = document.getElementById(`${this.id}-error`);
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.classList.add('hidden');
                }
                this.classList.remove('border-red-500');
            });
        });
    }

    const imageUploadBox = document.getElementById('imageuploadbox');
    const imageChangeInput = document.getElementById('image-change');
    const previewImage = document.getElementById('previewimage');
    const imageFile = document.getElementById('imagefile');
    const uploadBox = document.getElementById('imageuploding-box');

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Error', 'Please select an image file');
            event.target.value = '';
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showToast('error', 'Error', 'Image size should be less than 10MB');
            event.target.value = '';
            return;
        }

        const imagePreview = document.getElementById('previewimage');
        const imageFile = document.getElementById('imagefile');
        const imageUploadBox = document.getElementById('imageuploding-box');

        if (imagePreview && imageFile && imageUploadBox) {
            // Create a URL for the selected file
            const imageUrl = URL.createObjectURL(file);
            imageFile.src = imageUrl;
            imageUploadBox.classList.add('hidden');
            imagePreview.classList.remove('hidden');
        }
    }

    function handleImageChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Error', 'Please select an image file');
            event.target.value = '';
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showToast('error', 'Error', 'Image size should be less than 10MB');
            event.target.value = '';
            return;
        }

        const imageFile = document.getElementById('imagefile');
        if (imageFile) {
            const imageUrl = URL.createObjectURL(file);
            imageFile.src = imageUrl;
            
            // Copy the file to the main image input
            const imageInput = document.getElementById('imageuploadbox');
            if (imageInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                imageInput.files = dataTransfer.files;
            }
        }
    }

    // Handle initial image upload
    if (imageUploadBox) {
        imageUploadBox.addEventListener('change', handleImageUpload);
    }

    // Handle image change
    if (imageChangeInput) {
        imageChangeInput.addEventListener('change', handleImageChange);
    }
});

var currentPage = 1;
var itemsPerPage = 5; 
var searchQuery = '';
var totalPages = 1;
var totalItems = 0;

// employee fetch with pagination
function employeeGet(page = currentPage, limit = itemsPerPage, search = searchQuery) {
    const queryParams = new URLSearchParams({
        page,
        limit,
        ...(search && { search })
    });

    fetch(`/api/employees?${queryParams}`)
        .then(response => response.json())
        .then(result => {
            console.log('Received employees data:', result);
            if (result.success) {
                allEmployees = result.data;
                totalPages = result.pagination.totalPages;
                totalItems = result.pagination.totalItems; // Store total items
                updatePaginationUI(result.pagination);
                displayEmployees();
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(error => {
            console.error('Error fetching employees:', error);
            document.getElementById('table-body').innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-red-500">
                        Failed to load employees. Please try again.
                    </td>
                </tr>
            `;
        });
}

function updatePaginationUI(pagination) {
    const { currentPage, totalPages } = pagination;
    
    // Update total pages
    const pageCountEl = document.querySelector('.pageCount');
    if (pageCountEl) {
        pageCountEl.textContent = `of ${totalPages}`;
    }

    // Update pagination list
    const paginationList = document.getElementById('paginationList');
    if (paginationList) {
        let paginationHTML = `
            <li onclick="changePage(-1)" class="p-2 px-3 rounded-lg bg-white text-primaryText hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50' : 'cursor-pointer'}">
                <i class="fa fa-angle-left"></i>
            </li>`;

        // Generate page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || // First page
                i === totalPages || // Last page
                (i >= currentPage - 1 && i <= currentPage + 1) // Pages around current page
            ) {
                const offset = i - currentPage; // Calculate offset from current page
                paginationHTML += `
                    <li onclick="changePage(${offset})" 
                        class="p-2 px-3 rounded-lg ${i === currentPage ? 'bg-[#4318FF] text-[#ffff]' : 'bg-white text-primaryText hover:bg-gray-200 cursor-pointer'}">
                        ${i}
                    </li>`;
            } else if (
                i === currentPage - 2 ||
                i === currentPage + 2
            ) {
                // Add ellipsis
                paginationHTML += `
                    <li class="p-2 px-3">...</li>`;
            }
        }

        paginationHTML += `
            <li onclick="changePage(1)" class="p-2 px-3 rounded-lg bg-white text-primaryText hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50' : 'cursor-pointer'}">
                <i class="fa fa-angle-right"></i>
            </li>`;

        paginationList.innerHTML = paginationHTML;
    }

    // Update items per page dropdown
    const select = document.getElementById('employeePerpage');
    if (select) {
        select.value = itemsPerPage;
    }
}

// Handle page navigation
function changePage(direction) {
    if (typeof direction === 'number') {
        const newPage = currentPage + direction;
        // Check if the new page is within valid range
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            employeeGet(currentPage, itemsPerPage, searchQuery);
        }
    }
}

// Handle items per page change
function changeItemsPerPage(value) {
    itemsPerPage = parseInt(value);
    currentPage = 1; // Reset to first page
    employeeGet(currentPage, itemsPerPage, searchQuery);
}

// Handle search
function handleSearch(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        searchQuery = event.target.value.trim();
        currentPage = 1; // Reset to first page
        employeeGet(currentPage, itemsPerPage, searchQuery);
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set up search input event listener
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', handleSearch);
    }

    // Set up items per page event listener
    const itemsPerPageSelect = document.getElementById('employeePerpage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function() {
            changeItemsPerPage(this.value);
        });
    }

    // Add event listener for overlay click to close modal
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', function(event) {
            if (event.target === overlay) {
                closeAllModals();
            }
        });
    }

    // Initial load
    employeeGet();
});

var allEmployees = [];

function slnumber(num) {
    return num < 10 ? '0' : '';
}

function getDefaultImageUrl(employee) {
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
    
    // Create URL for UI Avatars API with proper encoding
    const params = new URLSearchParams({
        name: firstLetter,
        background: backgroundColor,
        color: 'fff',
        size: '256',
        bold: 'true',
        'font-size': '0.6'
    });
    
    return `https://ui-avatars.com/api/?${params.toString()}`;
}

function displayEmployees() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    let tableData = "";
    allEmployees.forEach((employee, index) => {
        const serialNumber = (currentPage - 1) * itemsPerPage + (index + 1);
        const imageUrl = employee.imageUrl || getDefaultImageUrl(employee);
        
        tableData += `
        <tr class="font-semibold text-[#2B3674] border-b relative">
            <td class="text-[14px] p-4 hidden min-860:table-cell">#${slnumber(serialNumber)}${serialNumber}</td>
            <td class="flex items-center gap-2 text-[14px] p-4">
                <img src="${imageUrl}" 
                     alt="${employee.firstName}'s photo" 
                     class="rounded-full w-10 h-10 object-cover">
                <div>
                    <div>${employee.salutation || ''} ${employee.firstName} ${employee.lastName}</div>
                    <div class="text-xs text-gray-500">${employee.designation || ''}</div>
                </div> 
            </td>
            <td class="text-[14px] p-4 hidden min-530:table-cell">${employee.email}</td>
            <td class="text-[14px] p-4 hidden min-961:table-cell">${employee.phone}</td>
            <td class="text-[14px] p-4 hidden min-1150:table-cell">${employee.gender}</td>
            <td class="text-[14px] p-4 hidden min-1277:table-cell">${employee.dob || ''}</td>
            <td class="text-[14px] p-4 hidden min-1165:table-cell">${employee.country || ''}</td>
            <td>
                <button type="button" class="text-2xl px-2 py-[4px] bg-tablebtn rounded-[10px]" onclick="toggleSidebox(this)">
                    <i class="fa-solid fa-ellipsis"></i>
                </button>
                <div id="sidebox" class="absolute top-[50px] right-[34px] z-10 px-2 py-4 rounded-[14px] border border-boderColor bg-white shadow-[0px_1px_4px_0px_rgba(16,16,49,0.12)] z-4 hidden">
                    <a href="/view/${employee._id}"><button class="flex gap-2 items-center p-2 text-primaryText font-semibold"><i class="fa-regular fa-eye"></i> View Details</button></a>
                    <button class="flex gap-2 items-center p-2 text-primaryText font-semibold" onclick="editForm('${employee._id}')"><i class="fa-solid fa-pen"></i>Edit</button>
                    <button type="button" class="flex gap-2 items-center p-2 text-primaryText font-semibold" onclick="deleteBox('${employee._id}')"><i class="fa-regular fa-trash-can"></i>Delete</button>
                </div>
            </td>
        </tr>
        `;
    });
    
    tableBody.innerHTML = tableData || `
        <tr>
            <td colspan="8" class="text-center py-4 text-gray-500">
                No employees found
            </td>
        </tr>
    `;
}

async function updateViewPageDetails() {
    try {
        // Extract employee ID from URL
        const pathParts = window.location.pathname.split('/');
        const employeeId = pathParts[pathParts.length - 1];
        
        if (!employeeId) {
            throw new Error('Employee ID not found in URL');
        }

        const response = await fetch(`/api/employees/${employeeId}`);
        if (!response.ok) throw new Error('Failed to fetch employee data');
        
        const result = await response.json();
        if (!result.success || !result.data) throw new Error('Invalid employee data received');
        
        const employee = result.data;
        
        // Update view box with employee details
        const viewBox = document.querySelector('.ViewEmployeeBox');
        if (!viewBox) throw new Error('View box not found');
        
        // Update employee details
        const fields = {
            'view-name': `${employee.salutation} ${employee.firstName} ${employee.lastName}`,
            'view-email': employee.email,
            'view-phone': employee.phone,
            'view-dob': new Date(employee.dob).toLocaleDateString(),
            'view-gender': employee.gender,
            'view-qualifications': employee.qualifications,
            'view-address': employee.address,
            'view-username': employee.username,
            'view-location': `${employee.city}, ${employee.state}, ${employee.country}`,
            'view-pinzip': employee.pinZip,
            'view-department': employee.department,
            'view-status': employee.status,
            'view-salary': employee.salary
        };
        
        for (const [id, value] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'Not provided';
            }
        }
        
        // Update employee image
        const viewImage = document.getElementById('view-image');
        if (viewImage) {
            viewImage.src = employee.imageUrl || getDefaultImageUrl(employee);
            viewImage.alt = `${employee.firstName} ${employee.lastName}'s photo`;
        }
        
    } catch (error) {
        console.error('Error updating view details:', error);
        showToast('error', 'Error', error.message || 'Failed to update view details');
    }
}

// Function to open the add employee form
function openAddEmployeeForm() {
    clearAllErrorMessages(); // Clear error messages when opening new form
    const formbox = document.getElementById('formbox');
    const overlay = document.getElementById('overlay');
    const form = document.getElementById('FormClearing');

    if (formbox && overlay && form) {
        formbox.classList.remove('hidden');
        overlay.classList.remove('hidden');
        form.reset();
        form.dataset.employeeId = '';
        
        // Make password required for new employees
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.setAttribute('required', 'required');
        }
    }
    
    // Reset image preview
    const imagePreview = document.getElementById('previewimage');
    const imageUploadBox = document.getElementById('imageuploding-box');
    if (imagePreview && imageUploadBox) {
        imagePreview.classList.add('hidden');
        imageUploadBox.classList.remove('hidden');
        const imageFile = document.getElementById('imagefile');
        if (imageFile) {
            imageFile.src = '';
        }
    }

    // Change form title and button text
    const formTitle = document.getElementById('changeform');
    if (formTitle) {
        formTitle.textContent = 'Add Employee';
    } else {
        console.error('Form title element not found');
    }

    const submitButton = document.querySelector('#FormClearing button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Add Employee';
    } else {
        console.error('Submit button not found');
    }

    // Show the form modal
    showFormModal();
}

// Function to populate form for editing
async function editEmployee(id) {
    clearAllErrorMessages(); // Clear error messages when opening edit form
    try {
        console.log('Editing employee with ID:', id);
        
        // Fetch employee data
        const response = await fetch(`/api/employees/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch employee data');
        }
        
        const result = await response.json();
        console.log('Received employee data:', result);
        
        if (!result.success || !result.data) {
            throw new Error('Invalid employee data received');
        }
        
        const employee = result.data;
        
        // Change form title and button
        const formTitle = document.getElementById('changeform');
        const submitButton = document.querySelector('#FormClearing button[type="submit"]');
        
        if (!formTitle || !submitButton) {
            console.error('Form elements not found:', { formTitle, submitButton });
            throw new Error('Form elements not found');
        }
        
        formTitle.textContent = 'Edit Employee';
        submitButton.textContent = 'Update Employee';
        
        // Add employee ID to form and hidden input
        const form = document.getElementById('FormClearing');
        if (!form) {
            throw new Error('Form not found');
        }
        
        // Create or update hidden employee ID input
        let employeeIdInput = document.getElementById('employeeId');
        if (!employeeIdInput) {
            employeeIdInput = document.createElement('input');
            employeeIdInput.type = 'hidden';
            employeeIdInput.id = 'employeeId';
            employeeIdInput.name = 'employeeId';
            form.appendChild(employeeIdInput);
        }
        employeeIdInput.value = id;

        // Populate form fields
        const fields = {
            'salutation': employee.salutation || '',
            'firstName': employee.firstName || '',
            'lastName': employee.lastName || '',
            'email': employee.email || '',
            'phone': employee.phone || '',
            'username': employee.username || '',
            'dob': employee.dob ? employee.dob.split('T')[0] : '',
            'qualifications': employee.qualifications || '',
            'address': employee.address || '',
            'pinZip': employee.pinZip || '',
            'department': employee.department || '',
            'status': employee.status || '',
            'salary': employee.salary || ''
        };

        // Set all field values
        Object.keys(fields).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = fields[key];
            }
        });

        // Handle country and state selection
        const countrySelect = document.getElementById('country');
        const stateSelect = document.getElementById('state');
        
        if (countrySelect && employee.country) {
            countrySelect.value = employee.country;
            
            // Wait for states to load before setting state value
            if (employee.state) {
                const waitForStates = setInterval(() => {
                    if (!stateSelect.disabled && stateSelect.options.length > 1) {
                        stateSelect.value = employee.state;
                        clearInterval(waitForStates);
                    }
                }, 100);
                
                // Clear interval after 5 seconds to prevent infinite loop
                setTimeout(() => clearInterval(waitForStates), 5000);
            }
            
            // Trigger change event to load states
            countrySelect.dispatchEvent(new Event('change'));
        }

        if (employee.city) {
            const cityInput = document.getElementById('city');
            if (cityInput) {
                cityInput.value = employee.city;
            }
        }

        // Handle password field for edit mode
        const passwordField = document.getElementById('password');
        const editModeText = document.querySelector('.edit-mode-text');
        if (passwordField) {
            passwordField.value = '';
            passwordField.removeAttribute('required');
            passwordField.placeholder = 'Enter new password to change';
            if (editModeText) {
                editModeText.classList.remove('hidden');
            }
        }

        // Set gender radio button
        if (employee.gender) {
            const genderInput = document.querySelector(`input[name="gender"][value="${employee.gender}"]`);
            if (genderInput) {
                genderInput.checked = true;
            }
        }

        // Show preview if image exists
        const previewBox = document.getElementById('previewimage');
        const imagePreview = document.getElementById('imagefile');
        const letterAvatar = document.getElementById('letter-avatar');
        const uploadBox = document.getElementById('imageuploding-box');
            
        if (previewBox && imagePreview && letterAvatar && uploadBox) {
            if (employee.imageUrl) {
                imagePreview.src = employee.imageUrl;
                imagePreview.classList.remove('hidden');
                letterAvatar.classList.add('hidden');
            } else {
                // Use letter avatar
                const avatarUrl = getDefaultImageUrl(employee);
                imagePreview.src = avatarUrl;
                imagePreview.classList.remove('hidden');
                letterAvatar.classList.add('hidden');
            }
            previewBox.classList.remove('hidden');
            uploadBox.classList.add('hidden');
        }

        // Store the employee ID for later use
        selectedEmployeeId = id;
        
        // Show the form
        showFormModal();
        
    } catch (error) {
        console.error('Error in editEmployee:', error);
        showToast('error', 'Error', error.message || 'Failed to load employee data');
    }
}

// Function to show form modal
function showFormModal() {
    const formModal = document.getElementById('formbox');
    if (formModal) {
        formModal.classList.remove('hidden');
    } else {
        console.error('Form modal element not found');
    }
}

// Function to hide form modal
function hideFormModal() {
    const formModal = document.getElementById('formbox');
    if (formModal) {
        formModal.classList.add('hidden');
    }
}

// Function to open the form for adding a new employee
function formbox() {
    // Reset form
    document.getElementById('FormClearing').reset();
    clearAllErrorMessages();
    
    // Reset form title and button
    const formTitle = document.getElementById('changeform');
    const submitButton = document.querySelector('#FormClearing button[type="submit"]');
    if (formTitle) formTitle.textContent = 'Add Employee';
    if (submitButton) submitButton.textContent = 'Add Employee';
    
    // Reset image preview
    const imagePreview = document.getElementById('previewimage');
    const imageUploadBox = document.getElementById('imageuploding-box');
    if (imagePreview && imageUploadBox) {
        imagePreview.classList.add('hidden');
        imageUploadBox.classList.remove('hidden');
    }
    
    // Make password field required for new employees
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.setAttribute('required', 'required');
    }
    
    // Show the form
    showFormModal();
}

// Function to update view page details with better error handling and feedback
async function updateViewPageDetails() {
    try {
        // Extract employee ID from URL
        const pathParts = window.location.pathname.split('/');
        const employeeId = pathParts[pathParts.length - 1];
        
        if (!employeeId) {
            throw new Error('Employee ID not found in URL');
        }

        const response = await fetch(`/api/employees/${employeeId}`);
        if (!response.ok) throw new Error('Failed to fetch employee data');
        
        const result = await response.json();
        if (!result.success || !result.data) throw new Error('Invalid employee data received');
        
        const employee = result.data;
        
        // Update view box with employee details
        const viewBox = document.querySelector('.ViewEmployeeBox');
        if (!viewBox) throw new Error('View box not found');
        
        // Update employee details
        const fields = {
            'view-name': `${employee.salutation} ${employee.firstName} ${employee.lastName}`,
            'view-email': employee.email,
            'view-phone': employee.phone,
            'view-dob': new Date(employee.dob).toLocaleDateString(),
            'view-gender': employee.gender,
            'view-qualifications': employee.qualifications,
            'view-address': employee.address,
            'view-username': employee.username,
            'view-location': `${employee.city}, ${employee.state}, ${employee.country}`,
            'view-pinzip': employee.pinZip,
            'view-department': employee.department,
            'view-status': employee.status,
            'view-salary': employee.salary
        };
        
        for (const [id, value] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'Not provided';
            }
        }
        
        // Update employee image
        const viewImage = document.getElementById('view-image');
        if (viewImage) {
            viewImage.src = employee.imageUrl || getDefaultImageUrl(employee);
            viewImage.alt = `${employee.firstName} ${employee.lastName}'s photo`;
        }
        
    } catch (error) {
        console.error('Error updating view details:', error);
        showToast('error', 'Error', error.message || 'Failed to update view details');
    }
}

// Call updateViewPageDetails when on view page
if (window.location.pathname.startsWith('/view/')) {
    updateViewPageDetails();
}

// Function to clear all error messages
function clearAllErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.add('hidden');
    });
    
    // Remove red borders from inputs
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.classList.remove('border-red-500');
    });
}

// Function to validate form fields
function validateForm() {
    let isValid = true;
    
    // Required fields
    const requiredFields = [
        { id: 'salutation', name: 'Salutation' },
        { id: 'firstName', name: 'First Name' },
        { id: 'lastName', name: 'Last Name' },
        { id: 'email', name: 'Email' },
        { id: 'phone', name: 'Phone' },
        { id: 'dob', name: 'Date of Birth' },
        { id: 'qualifications', name: 'Qualifications' },
        { id: 'address', name: 'Address' },
        { id: 'country', name: 'Country' },
        { id: 'state', name: 'State' },
        { id: 'city', name: 'City' },
        { id: 'pinZip', name: 'PIN/ZIP' },
        { id: 'username', name: 'Username' },
        { id: 'department', name: 'Department' },
        { id: 'status', name: 'Status' },
        { id: 'salary', name: 'Salary' }
    ];

    // Clear all previous error messages and styling
    clearAllErrorMessages();

    const form = document.getElementById('FormClearing');
    const isNewEmployee = !form.dataset.employeeId && !document.getElementById('employeeId');

    // Password validation
    const password = document.getElementById('password');
    const passwordError = document.getElementById('password-error');
    
    if (isNewEmployee) {
        // For new employees, password is required
        if (!password || !password.value.trim()) {
            if (passwordError) {
                passwordError.textContent = 'Password is required for new employees';
                passwordError.classList.remove('hidden');
                password?.classList.add('border-red-500');
            }
            isValid = false;
        } else if (password.value.trim().length < 6) {
            if (passwordError) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.classList.remove('hidden');
                password.classList.add('border-red-500');
            }
            isValid = false;
        }
    } else {
        // For existing employees, password is optional but must be at least 6 chars if provided
        if (password && password.value.trim() && password.value.trim().length < 6) {
            if (passwordError) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.classList.remove('hidden');
                password.classList.add('border-red-500');
            }
            isValid = false;
        }
    }

    // Validate each required field
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element) {
            console.error(`Field with id '${field.id}' not found`);
            return;
        }

        const value = element.value.trim();
        const errorElement = document.getElementById(`${field.id}-error`);
        
        if (!value) {
            if (errorElement) {
                errorElement.textContent = `${field.name} is required`;
                errorElement.classList.remove('hidden');
                element.classList.add('border-red-500');
            }
            isValid = false;
        }
    });

    // Additional validations...
    // Email validation
    const email = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    if (email && email.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            if (emailError) {
                emailError.textContent = 'Please enter a valid email address';
                emailError.classList.remove('hidden');
                email.classList.add('border-red-500');
            }
            isValid = false;
        }
    }

    // Phone number validation
    const phone = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    if (phone && phone.value.trim()) {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone.value.trim())) {
            if (phoneError) {
                phoneError.textContent = 'Phone number must be 10 digits';
                phoneError.classList.remove('hidden');
                phone.classList.add('border-red-500');
            }
            isValid = false;
        }
    }

    // Password length validation for new employees
    if (isNewEmployee) {
        const password = document.getElementById('password');
        const passwordError = document.getElementById('password-error');
        if (password && password.value.trim().length < 6) {
            if (passwordError) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.classList.remove('hidden');
                password.classList.add('border-red-500');
            }
            isValid = false;
        }
    }

    // Gender selection validation
    const genderSelected = document.querySelector('input[name="gender"]:checked');
    if (!genderSelected) {
        const errorElement = document.getElementById('gender-error');
        if (errorElement) {
            errorElement.textContent = 'Please select a gender';
            errorElement.classList.remove('hidden');
        }
        isValid = false;
    }

    // Salary validation
    const salary = document.getElementById('salary');
    const salaryError = document.getElementById('salary-error');
    if (salary && salary.value.trim()) {
        const salaryValue = parseFloat(salary.value.trim());
        if (isNaN(salaryValue) || salaryValue < 0) {
            if (salaryError) {
                salaryError.textContent = 'Please enter a valid salary amount';
                salaryError.classList.remove('hidden');
                salary.classList.add('border-red-500');
            }
            isValid = false;
        }
    }

    return isValid;
}

// Function to handle employee data refresh
async function refreshEmployeeData(employeeId) {
    try {
        // Fetch employee data
        const response = await fetch(`/api/employees/${employeeId}`);
        if (!response.ok) throw new Error('Failed to fetch employee data');
        
        const result = await response.json();
        if (!result.success || !result.data) throw new Error('Invalid employee data received');
        
        const employee = result.data;
        
        // Update view box with employee details
        const viewBox = document.querySelector('.ViewEmployeeBox');
        if (!viewBox) throw new Error('View box not found');
        
        // Update employee details
        const fields = {
            'view-name': `${employee.salutation} ${employee.firstName} ${employee.lastName}`,
            'view-email': employee.email,
            'view-phone': employee.phone,
            'view-dob': new Date(employee.dob).toLocaleDateString(),
            'view-gender': employee.gender,
            'view-qualifications': employee.qualifications,
            'view-address': employee.address,
            'view-username': employee.username,
            'view-location': `${employee.city}, ${employee.state}, ${employee.country}`,
            'view-pinzip': employee.pinZip,
            'view-department': employee.department,
            'view-status': employee.status,
            'view-salary': employee.salary
        };
        
        for (const [id, value] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'Not provided';
            }
        }
        
        // Update employee image
        const viewImage = document.getElementById('view-image');
        if (viewImage) {
            viewImage.src = employee.imageUrl || getDefaultImageUrl(employee);
            viewImage.alt = `${employee.firstName} ${employee.lastName}'s photo`;
        }
        
    } catch (error) {
        console.error('Error refreshing employee data:', error);
        showToast('error', 'Refresh Failed', 'Failed to refresh employee data');
    }
}

document.getElementById('deletebox')?.addEventListener('click', deleteEmployee);

// Add event listeners to clear error messages on input
document.addEventListener('DOMContentLoaded', function() {
    // For all input and select fields
    const requiredFields = [
        { id: 'salutation', label: 'Salutation' },
        { id: 'firstName', label: 'First Name' },
        { id: 'lastName', label: 'Last Name' },
        { id: 'email', label: 'Email' },
        { id: 'phone', label: 'Phone' },
        { id: 'dob', label: 'Date of Birth' },
        { id: 'qualifications', label: 'Qualifications' },
        { id: 'address', label: 'Address' },
        { id: 'country', label: 'Country' },
        { id: 'state', label: 'State' },
        { id: 'city', label: 'City' },
        { id: 'pinZip', label: 'PIN/ZIP' },
        { id: 'username', label: 'Username' },
        { id: 'department', label: 'Department' },
        { id: 'status', label: 'Status' },
        { id: 'salary', label: 'Salary' }
    ];

    requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;

        const errorElement = document.getElementById(`${field.id}-error`);
        if (!errorElement) return;

        // Clear error message on input/change
        input.addEventListener('input', function() {
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
            input.classList.remove('border-red-500');
        });
        input.addEventListener('change', function() {
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
            input.classList.remove('border-red-500');
        });
    });

    // For password field
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('password-error');
    if (passwordInput && passwordError) {
        passwordInput.addEventListener('input', function() {
            passwordError.textContent = '';
        });
    }

    // For gender radio buttons
    const genderInputs = document.querySelectorAll('input[name="gender"]');
    const genderError = document.getElementById('gender-error');
    if (genderError) {
        genderInputs.forEach(input => {
            input.addEventListener('change', function() {
                genderError.textContent = '';
            });
        });
    }
});