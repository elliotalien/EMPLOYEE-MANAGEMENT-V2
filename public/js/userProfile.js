function updateUsername(fullName) {
    const username = fullName.split(' ')[0].toLowerCase();
    const usernameElements = document.querySelectorAll('.username-display');
    usernameElements.forEach(element => {
        element.textContent = username;
    });
}

function showDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.classList.remove('hidden');
    }
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.classList.add('hidden');
    }
}

async function confirmDeleteAccount() {
    try {
        const response = await fetch('/api/user/profile', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        if (data.success) {
            showToast('success', 'Success', 'Account deleted successfully');
            document.body.style.cursor = 'wait';
            const deleteModal = document.getElementById('deleteModal');
            if (deleteModal) {
                deleteModal.style.pointerEvents = 'none';
            }
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            throw new Error(data.message || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', error.message || 'Failed to delete account');
        closeDeleteModal();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('imageUpload');
    const profileImage = document.getElementById('profileImage');
    const profileForm = document.getElementById('profileForm');
    const deleteModal = document.getElementById('deleteModal');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', showDeleteModal);
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteAccount);
    }

    if (imageUpload && profileImage) {
        imageUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            profileImage.style.opacity = '0.5';

            try {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImage.src = e.target.result;
                    profileImage.style.opacity = '1';
                }
                reader.readAsDataURL(file);

                const formData = new FormData();
                formData.append('profileImage', file);

                const response = await fetch('/api/user/profile/image', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    const profileImageUrl = result.user?.profileImage?.url;
                    
                    if (profileImageUrl) {
                        const profileImages = document.querySelectorAll('img[id^="profileImage"]');
                        profileImages.forEach(img => {
                            img.src = profileImageUrl;
                            img.setAttribute('data-original-src', profileImageUrl);
                        });
                        
                        showToast('success', 'Success', 'Profile image updated successfully');
                        
                        setTimeout(() => {
                            window.location.href = '/profile';
                        }, 1000);
                    } else {
                        showToast('error', 'Error', 'Failed to update profile image - missing image URL');
                    }
                } else {
                    showToast('error', 'Error', result.message || 'Failed to update profile image');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('error', 'Error', 'Failed to update profile image');
                profileImage.style.opacity = '1';
                profileImage.src = profileImage.getAttribute('data-original-src') || profileImage.src;
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const formData = {
                    username: document.getElementById('username').value,
                    phone: document.getElementById('phone').value
                };

                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;

                if (currentPassword && newPassword) {
                    formData.currentPassword = currentPassword;
                    formData.newPassword = newPassword;
                }
                
                const response = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    showToast('success', 'Success', 'Profile updated successfully');
                    if (currentPassword && newPassword) {
                        document.getElementById('currentPassword').value = '';
                        document.getElementById('newPassword').value = '';
                    }
                } else {
                    throw new Error(result.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('error', 'Error', error.message || 'Failed to update profile');
            }
        });
    }

    if (profileImage) {
        profileImage.dataset.originalSrc = profileImage.src;
    }

    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }
});
