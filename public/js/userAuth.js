// Toast notification system
var toastContainer;

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

// Move validateEmail function to global scope
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

document.addEventListener('DOMContentLoaded', function() {
    // Check for error parameter in URL for login page
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error === 'invalid_reset') {
        showToast('error', 'Reset Link Invalid', 'This password reset link has expired or already been used. Please request a new one from the "Forgot Password" link below.');
    }

    // Handle signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const usernameError = document.getElementById('usernameError');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');

        function setError(element, message) {
            element.textContent = message;
            element.previousElementSibling.classList.add('border-red-500');
            element.previousElementSibling.classList.remove('border-[#151111]/20', 'focus:border-[#301F81]');
        }

        function clearError(element) {
            element.textContent = '';
            element.previousElementSibling.classList.remove('border-red-500');
            element.previousElementSibling.classList.add('border-[#151111]/20');
        }

        // Clear errors as user types
        usernameInput.addEventListener('input', () => clearError(usernameError));
        emailInput.addEventListener('input', () => clearError(emailError));
        passwordInput.addEventListener('input', () => {
            clearError(passwordError);
            if (confirmPasswordInput.value) {
                validatePasswordMatch();
            }
        });
        confirmPasswordInput.addEventListener('input', () => {
            clearError(confirmPasswordError);
            validatePasswordMatch();
        });

        function validatePasswordMatch() {
            if (passwordInput.value !== confirmPasswordInput.value) {
                setError(confirmPasswordError, 'Passwords do not match');
                return false;
            }
            clearError(confirmPasswordError);
            return true;
        }

        function validatePassword(password) {
            if (password.length < 6) {
                setError(passwordError, 'Password must be at least 6 characters long');
                return false;
            }
            clearError(passwordError);
            return true;
        }

        function validateUsername(username) {
            if (username.length < 3) {
                setError(usernameError, 'Username must be at least 3 characters long');
                return false;
            }
            clearError(usernameError);
            return true;
        }

        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            let isValid = true;

            // Clear previous errors
            clearError(usernameError);
            clearError(emailError);
            clearError(passwordError);
            clearError(confirmPasswordError);

            // Validate all fields
            if (!username) {
                setError(usernameError, 'Please enter a username');
                isValid = false;
            } else if (!validateUsername(username)) {
                isValid = false;
            }

            if (!email) {
                setError(emailError, 'Please enter an email address');
                isValid = false;
            } else if (!validateEmail(email)) {
                isValid = false;
            }

            if (!password) {
                setError(passwordError, 'Please enter a password');
                isValid = false;
            } else if (!validatePassword(password)) {
                isValid = false;
            }

            if (!confirmPassword) {
                setError(confirmPasswordError, 'Please confirm your password');
                isValid = false;
            } else if (!validatePasswordMatch()) {
                isValid = false;
            }

            if (!isValid) return;

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password
                    })
                });

                const data = await response.json();

                if (data.status === 'error') {
                    // Handle specific error cases
                    if (data.message.toLowerCase().includes('username')) {
                        setError(usernameError, data.message);
                    } else if (data.message.toLowerCase().includes('email')) {
                        setError(emailError, data.message);
                    } else if (data.message.toLowerCase().includes('password')) {
                        setError(passwordError, data.message);
                    } else {
                        showToast('error', 'Registration Failed', data.message);
                    }
                    return;
                }

                // Show success message
                showToast('success', 'Registration successful', 'Please check your email for verification');
                
                // Redirect to verification page
                setTimeout(() => {
                    window.location.href = data.redirectUrl || '/verify';
                }, 1500);
            } catch (error) {
                showToast('error', 'Registration Failed', 'An error occurred during registration');
            }
        });
    }

    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const usernameOrEmailInput = document.getElementById('usernameOrEmail');
        const passwordInput = document.getElementById('password');
        const usernameOrEmailError = document.getElementById('usernameOrEmailError');
        const passwordError = document.getElementById('passwordError');

        function setError(element, message) {
            element.textContent = message;
            element.previousElementSibling.classList.add('border-red-500');
            element.previousElementSibling.classList.remove('border-[#151111]/20', 'focus:border-[#301F81]');
        }

        function clearError(element) {
            element.textContent = '';
            element.previousElementSibling.classList.remove('border-red-500');
            element.previousElementSibling.classList.add('border-[#151111]/20');
        }

        // Clear errors as user types
        usernameOrEmailInput.addEventListener('input', () => {
            clearError(usernameOrEmailError);
        });

        passwordInput.addEventListener('input', () => {
            clearError(passwordError);
        });

        // Form submission
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usernameOrEmail = usernameOrEmailInput.value.trim();
            const password = passwordInput.value;
            let isValid = true;

            // Clear previous errors
            clearError(usernameOrEmailError);
            clearError(passwordError);

            // Validate username/email
            if (!usernameOrEmail) {
                setError(usernameOrEmailError, 'Please enter your username or email');
                isValid = false;
            }

            // Validate password
            if (!password) {
                setError(passwordError, 'Please enter your password');
                isValid = false;
            } else if (password.length < 6) {
                setError(passwordError, 'Password must be at least 6 characters');
                isValid = false;
            }

            if (!isValid) return;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        usernameOrEmail,
                        password
                    })
                });

                const data = await response.json();

                if (data.status === 'error') {
                    const errorMessage = data.message.toLowerCase();
                    
                    if (errorMessage.includes('password')) {
                        setError(passwordError, data.message);
                        passwordInput.value = ''; // Clear password field
                    } else if (errorMessage.includes('account') || errorMessage.includes('email') || errorMessage.includes('username')) {
                        setError(usernameOrEmailError, data.message);
                    } else {
                        // Generic error
                        showToast('error', 'Login Failed', data.message);
                    }
                    return;
                }

                // Show success message
                showToast('success', 'Login successful', 'Redirecting to dashboard...');

                // Store the token
                localStorage.setItem('token', data.data.token);
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } catch (error) {
                showToast('error', 'Login Failed', 'An error occurred during login');
            }
        });
    }

    // Handle verification form
    const verificationForm = document.querySelector('form[action="/api/auth/verify"]');
    if (verificationForm) {
        const inputs = verificationForm.querySelectorAll('input[type="number"]');
        const resendButton = document.getElementById('resendButton');
        const timerDisplay = document.getElementById('timer');
        let resendTimer = 60;
        let resendInterval;

        // Auto-focus functionality
        inputs.forEach((input, index) => {
            input.addEventListener('input', function(e) {
                if (this.value.length >= 1) {
                    this.value = this.value.slice(0, 1);
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                }
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        // Start resend timer
        function startResendTimer() {
            resendButton.disabled = true;
            resendTimer = 60;
            clearInterval(resendInterval);
            
            resendInterval = setInterval(() => {
                resendTimer--;
                timerDisplay.textContent = `Resend in ${resendTimer}s`;
                
                if (resendTimer <= 0) {
                    clearInterval(resendInterval);
                    resendButton.disabled = false;
                    timerDisplay.textContent = '';
                }
            }, 1000);
        }

        // Start initial timer
        startResendTimer();

        // Handle form submission
        verificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const otp = Array.from(inputs)
                .map(input => input.value)
                .join('');

            if (otp.length !== 6) {
                showToast('error', 'Verification failed', 'Please enter all 6 digits of the OTP');
                return;
            }

            try {
                const response = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ otp })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Verification failed');
                }

                showToast('success', 'Verification successful', 'Email verified successfully!');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } catch (error) {
                showToast('error', 'Verification failed', error.message);
            }
        });

        // Handle resend OTP
        resendButton.addEventListener('click', async function() {
            if (this.disabled) return;

            try {
                const response = await fetch('/api/auth/resend-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to resend OTP');
                }

                showToast('success', 'OTP sent', 'OTP sent successfully!');
                startResendTimer();
            } catch (error) {
                showToast('error', 'OTP resend failed', error.message);
            }
        });
    }

    // Handle forgot password form
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('emailError');

        emailInput.addEventListener('input', () => clearError(emailError));

        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();

            // Validate email using the global validateEmail function
            if (!email || !validateEmail(email)) {
                setError(emailError, 'Please enter a valid email address');
                return;
            }

            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('success', 'Success', data.message);
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 3000);
                } else {
                    showToast('error', 'Error', data.message);
                }
            } catch (error) {
                showToast('error', 'Error', 'An error occurred. Please try again later.');
            }
        });
    }

    // Handle reset password form
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        // Get token from URL for reset password page
        const token = urlParams.get('token');
        
        if (!token) {
            window.location.href = '/login';
        }

        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const passwordError = document.getElementById('passwordError');
            const confirmPasswordError = document.getElementById('confirmPasswordError');

            // Clear previous errors
            passwordError.textContent = '';
            confirmPasswordError.textContent = '';

            // Basic password validation
            if (password.length < 6) {
                passwordError.textContent = 'Password must be at least 6 characters long';
                return;
            }

            // Validate password confirmation
            if (password !== confirmPassword) {
                confirmPasswordError.textContent = 'Passwords do not match';
                return;
            }

            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('success', 'Success', data.message);
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 3000);
                } else {
                    showToast('error', 'Error', data.message);
                }
            } catch (error) {
                showToast('error', 'Error', 'An error occurred. Please try again later.');
            }
        });
    }

    // Handle logout
    const logoutButton = document.querySelector('#logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.message || 'Logout failed');
                }

                showToast('success', 'Logout successful', 'You have been logged out.');
                window.location.replace('/');
            } catch (error) {
                showToast('error', 'Logout failed', error.message);
            }
        });
    }
});

function initializePasswordToggle() {
    // Password toggle functionality
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        // Check if the current path is not '/employees'
        if (window.location.pathname.startsWith('/employees')) {
            return;
        }

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        `;
        toggleBtn.className = 'absolute right-[0] top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none p-1';
        
        // Adjust input field padding to accommodate the icon
        field.style.paddingRight = '2.5rem';
        
        // Insert toggle button after password field
        field.parentElement.style.position = 'relative';
        field.parentElement.appendChild(toggleBtn);
        
        // Toggle password visibility
        toggleBtn.addEventListener('click', () => {
            const type = field.type === 'password' ? 'text' : 'password';
            field.type = type;
            
            // Update icon based on password visibility
            toggleBtn.innerHTML = type === 'password' ? `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ` : `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
            `;
        });
    });
}