document.addEventListener('DOMContentLoaded', () => {
    // ---- THEME TOGGLE ----
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if (themeToggle) themeToggle.textContent = '☀️';
        } else {
            body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.textContent = '🌙';
        }
    }
    applyTheme(localStorage.getItem('theme') || 'light');
    themeToggle?.addEventListener('click', () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // ---- NAVBAR SCROLL EFFECT ----
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // ---- HOME PAGE LOGIC ----
    if (body.id === 'home-page') {
        const gallery = document.getElementById('gallery');
        const searchBar = document.getElementById('search-bar');
        const sortOptions = document.getElementById('sort-options');
        const dateTimeEl = document.getElementById('date-time');
        let allPhotos = [];

        const updateDateTime = () => { if (dateTimeEl) dateTimeEl.textContent = new Date().toLocaleString(); };
        setInterval(updateDateTime, 1000);
        updateDateTime();
        
        function renderGallery(photos) {
            if (!gallery) return;
            gallery.innerHTML = photos.length ? '' : '<p>No photos found.</p>';
            photos.forEach((photo, index) => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.dataset.id = photo.id;
                item.style.animationDelay = `${index * 50}ms`;
                item.innerHTML = `
                    <img src="${photo.src}" alt="${photo.title}">
                    <div class="photo-info">
                        <h3>${photo.title}</h3>
                        <p>${new Date(photo.date).toLocaleDateString()}</p>
                        <p>${photo.description}</p>
                    </div>`;
                gallery.appendChild(item);
            });
        }

        function updateGalleryView() {
            let photosToDisplay = [...allPhotos];
            const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
            if (searchTerm) {
                photosToDisplay = photosToDisplay.filter(p => p.title.toLowerCase().includes(searchTerm));
            }
            const sortValue = sortOptions ? sortOptions.value : 'custom';
            switch (sortValue) {
                case 'date': photosToDisplay.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
                case 'title': photosToDisplay.sort((a, b) => a.title.localeCompare(b.title)); break;
                default: photosToDisplay.sort((a, b) => (a.order || 0) - (b.order || 0)); break;
            }
            renderGallery(photosToDisplay);
        }

        async function loadPhotosFromServer() {
            try {
                const response = await fetch('http://localhost:3000/api/photos');
                if (!response.ok) throw new Error('Network response was not ok');
                allPhotos = await response.json();
                updateGalleryView();
            } catch (error) {
                console.error('Failed to fetch photos:', error);
                if (gallery) gallery.innerHTML = '<p>Could not load photos. Is the server running?</p>';
            }
        }

        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDesc = document.getElementById('lightbox-description');
        const fullscreenBtn = document.querySelector('.lightbox-fullscreen');
        let currentPhotosForLightbox = [];
        let currentIndex = 0;

        function showLightbox(index) {
            if (!allPhotos.length) return;
            const sortedPhotos = [...allPhotos].sort((a, b) => (a.order || 0) - (b.order || 0));
            currentPhotosForLightbox = sortedPhotos;
            if (index < 0) index = currentPhotosForLightbox.length - 1;
            if (index >= currentPhotosForLightbox.length) index = 0;
            currentIndex = index;
            const photo = currentPhotosForLightbox[currentIndex];
            lightboxImg.src = photo.src;
            lightboxTitle.textContent = photo.title;
            lightboxDesc.textContent = photo.description;
            lightbox.style.display = 'flex';
        }

        gallery?.addEventListener('click', e => {
            const item = e.target.closest('.gallery-item');
            if (item) {
                const photoId = Number(item.dataset.id);
                const sortedPhotos = [...allPhotos].sort((a, b) => (a.order || 0) - (b.order || 0));
                const index = sortedPhotos.findIndex(p => p.id === photoId);
                if (index > -1) showLightbox(index);
            }
        });

        document.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.style.display = 'none');
        document.querySelector('.lightbox-prev')?.addEventListener('click', () => showLightbox(currentIndex - 1));
        document.querySelector('.lightbox-next')?.addEventListener('click', () => showLightbox(currentIndex + 1));
        
        fullscreenBtn?.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                if (lightbox.requestFullscreen) lightbox.requestFullscreen();
                else if (lightbox.webkitRequestFullscreen) lightbox.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        });

        searchBar?.addEventListener('input', updateGalleryView);
        sortOptions?.addEventListener('change', updateGalleryView);
        loadPhotosFromServer();
    }

    // ---- ADMIN PAGE LOGIC ----
    if (body.id === 'admin-page') {
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const loginForm = document.getElementById('login-form');
        const uploadForm = document.getElementById('upload-form');
        const adminGalleryList = document.getElementById('admin-gallery-list');
        
        function renderAdminList(photos) {
            if (!adminGalleryList) return;
            adminGalleryList.innerHTML = '';
            photos.sort((a, b) => (a.order || 0) - (b.order || 0));
            photos.forEach(photo => {
                const item = document.createElement('div');
                item.className = 'admin-gallery-item';
                item.dataset.id = photo.id;
                item.draggable = true;
                item.innerHTML = `
                    <img src="${photo.src}" alt="${photo.title}">
                    <div class="admin-item-details">
                        <strong>${photo.title}</strong>
                        <p>${new Date(photo.date).toLocaleDateString()}</p>
                    </div>
                    <div class="admin-item-actions">
                         <button class="btn-delete" data-id="${photo.id}">Delete</button>
                    </div>`;
                adminGalleryList.appendChild(item);
            });
        }
        
        async function loadAdminGallery() {
            try {
                const response = await fetch('http://localhost:3000/api/photos');
                const photos = await response.json();
                renderAdminList(photos);
                initDragAndDrop();
            } catch (error) {
                console.error('Failed to load admin gallery:', error);
            }
        }

        adminGalleryList?.addEventListener('click', async (e) => {
            if (e.target.matches('.btn-delete')) {
                const photoId = e.target.dataset.id;
                if (confirm('Are you sure you want to permanently delete this photo?')) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/photos/${photoId}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Failed to delete photo.');
                        loadAdminGallery();
                    } catch (error) {
                        console.error('Delete error:', error);
                        alert('Could not delete the photo.');
                    }
                }
            }
        });

        function initDragAndDrop() {
            let draggedItem = null;
            adminGalleryList.addEventListener('dragstart', e => {
                draggedItem = e.target.closest('.admin-gallery-item');
                if (draggedItem) setTimeout(() => draggedItem.classList.add('dragging'), 0);
            });
            adminGalleryList.addEventListener('dragend', async () => {
                if (!draggedItem) return;
                draggedItem.classList.remove('dragging');
                const newOrderIds = [...adminGalleryList.children].map(child => child.dataset.id);
                try {
                    await fetch('http://localhost:3000/api/photos/order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order: newOrderIds }),
                    });
                } catch (error) {
                    console.error('Failed to save new order:', error);
                    alert('Could not save the new order.');
                }
                draggedItem = null;
            });
            adminGalleryList.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = [...adminGalleryList.children].find(child => e.clientY < child.getBoundingClientRect().top + child.offsetHeight / 2);
                if (draggedItem && draggedItem !== afterElement) {
                    adminGalleryList.insertBefore(draggedItem, afterElement);
                }
            });
        }

        function setupUploadForm() {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = uploadForm.querySelector('button[type="submit"]');
                const formData = new FormData(uploadForm);
                submitButton.textContent = 'Uploading...';
                submitButton.disabled = true;
                try {
                    const response = await fetch('http://localhost:3000/api/upload', {
                        method: 'POST',
                        body: formData,
                    });
                    if (!response.ok) throw new Error(`Server responded with ${response.status}`);
                    const result = await response.json();
                    alert(result.message);
                    uploadForm.reset();
                    loadAdminGallery();
                } catch (error) {
                    console.error('Upload failed:', error);
                    alert('Upload failed. Please check the console and ensure the server is running.');
                } finally {
                    submitButton.textContent = 'Upload Photos';
                    submitButton.disabled = false;
                }
            });
        }
        
        const showDashboard = () => {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            setupUploadForm();
            loadAdminGallery();
            // This assumes a password change form exists in your admin.html
            // If not, you can remove this function call.
            if (document.getElementById('change-password-form')) {
                setupPasswordChangeForm();
            }
        };

        if (sessionStorage.getItem('loggedIn') === 'true') {
            showDashboard();
        }

        // --- EDITED: Secure Login Logic ---
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginError = document.getElementById('login-error');
            loginError.textContent = '';
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    sessionStorage.setItem('loggedIn', 'true');
                    showDashboard();
                } else {
                    const result = await response.json();
                    loginError.textContent = result.message || 'Invalid credentials.';
                }
            } catch (error) {
                loginError.textContent = 'Could not connect to the server.';
            }
        });

        // This function depends on the change password form in admin.html
        function setupPasswordChangeForm() {
            const form = document.getElementById('change-password-form');
            const messageEl = document.getElementById('password-message');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                messageEl.textContent = '';
                messageEl.classList.remove('error-message', 'success-message');

                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (newPassword !== confirmPassword) {
                    messageEl.textContent = 'New passwords do not match.';
                    messageEl.classList.add('error-message');
                    return;
                }

                try {
                    const response = await fetch('http://localhost:3000/api/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ currentPassword, newPassword })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        messageEl.textContent = result.message;
                        messageEl.classList.add('success-message');
                        form.reset();
                    } else {
                        messageEl.textContent = result.message;
                        messageEl.classList.add('error-message');
                    }
                } catch (error) {
                    messageEl.textContent = 'An error occurred. Please try again.';
                    messageEl.classList.add('error-message');
                }
            });
        }
    }
});