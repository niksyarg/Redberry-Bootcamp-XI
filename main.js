document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://api.redclass.redberryinternship.ge/api';

    // --- ПЕРЕМЕННЫЕ И ЭЛЕМЕНТЫ ---
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');
    let currentIndex = 0;

    const modalOverlay = document.getElementById('modal-overlay');
    const allModals = document.querySelectorAll('.modal-card');
    const displayUsername = document.getElementById('display-username');
    const profileFullnameInput = document.getElementById('profile-fullname');

    // --- СЛАЙДЕР (Slider Logic) ---
    function updateSlider(index) {
        if (slides.length === 0) return;
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        currentIndex = (index + slides.length) % slides.length;
        slides[currentIndex].classList.add('active');
        if(dots[currentIndex]) dots[currentIndex].classList.add('active');
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => updateSlider(currentIndex + 1));
        prevBtn.addEventListener('click', () => updateSlider(currentIndex - 1));
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => updateSlider(i));
    });

    // --- МОДАЛЬНЫЕ ОКНА (Modal Management) ---
    function openModal(modalId) {
        if (!document.getElementById(modalId)) return;
        modalOverlay.style.display = 'flex';
        allModals.forEach(modal => modal.style.display = 'none');
        document.getElementById(modalId).style.display = 'block';
    }

    function closeModal() {
        if(modalOverlay) modalOverlay.style.display = 'none';
        clearErrors();
        console.log('Modal closed');
    }

    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        const group = input.closest('.form-group');
        group.classList.add('has-error'); 
        input.classList.add('input-error');
        const errorSpan = group.querySelector('.error-msg');
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = 'block';
        }
    }

    function clearErrors() {
        document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    }

    // --- API ლოგიკა (Register, Login, Me, Logout) ---

    // 1. რეგისტრაცია (Register API)
   document.getElementById('btn-signup-finish')?.addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const username = document.getElementById('signup-username').value;
    const avatarInput = document.getElementById('avatar-input'); 

    // 1. ვქმნით FormData ობიექტს
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', password);

    // 2. ვამოწმებთ, აირჩია თუ არა მომხმარებელმა სურათი
    if (avatarInput && avatarInput.files[0]) {
        formData.append('avatar', avatarInput.files[0]);
    }

    try {
        // 3. ვაგზავნით formData-ს. Axios ავტომატურად დააყენებს სწორ Content-Type-ს
        const res = await axios.post(`${API_URL}/register`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        handleAuthSuccess(res.data.token, username);
    } catch (err) {
        console.error(err);
        // თუ სერვერი აბრუნებს კონკრეტულ შეცდომას (მაგ. username დაკავებულია)
        const errorMessage = err.response?.data?.message || 'Registration failed. Check details.';
        showError('signup-username', errorMessage);
    }
});
    // 2. შესვლა (Login API)
    document.getElementById('btn-login-submit')?.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            const data = res.data.data;
            handleAuthSuccess(data.token, data.user.username);
            console.log(res);
            closeModal(); 
            clearErrors();
        } catch (err) {
            showError('login-email', 'Invalid email or password');
        }
    });

    // 3. მომხმარებლის ინფორმაცია (Me API)
    async function fetchUserData() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (displayUsername) displayUsername.textContent = res.data.name;
            if (profileFullnameInput) profileFullnameInput.value = res.data.name;
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
        }
    }

    function handleAuthSuccess(token, name) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', token);
        closeModal();
        // renderLoggedInUI(true);
        // if (displayUsername) displayUsername.textContent = name;
    }

    // --- РЕГИСТРАЦИЯ: Навигация (Signup Navigation) ---
    document.getElementById('btn-signup-next-1')?.addEventListener('click', () => {
        clearErrors();
        const email = document.getElementById('signup-email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('signup-email', 'Please enter a valid email address');
        } else {
            openModal('modal-signup-2');
        }
    });

    document.getElementById('btn-signup-next-2')?.addEventListener('click', () => {
        clearErrors();
        const pass = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm-password').value;
        if (pass.length < 6) {
            showError('signup-password', 'Password must be at least 6 characters');
        } else if (pass !== confirm) {
            showError('signup-confirm-password', 'Passwords do not match');
        } else {
            openModal('modal-signup-3');
        }
    });

    // --- SIDEBAR (ENROLLED COURSES) ---
    const sidebar = document.getElementById('enrolled-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const enrolledLink = document.getElementById('enrolled-link');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    const closeSidebar = () => {
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.style.display = 'none';
    };

    if (enrolledLink) {
        enrolledLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (sidebar) sidebar.classList.add('open');
            if (sidebarOverlay) sidebarOverlay.style.display = 'block';
            renderSidebarContent();
        });
    }

    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    function renderSidebarContent() {
        const container = document.getElementById('sidebar-content');
        const countEl = document.getElementById('sidebar-count');
        const myCourses = JSON.parse(localStorage.getItem('myCourses')) || [];
        
        if (countEl) countEl.innerText = myCourses.length;
        if (!container) return;

        if (myCourses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="190" height="170" viewBox="0 0 190 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M95 140V90.5" stroke="#D1D1D1" stroke-width="5.33333" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M112.171 31.1544C113.52 30.3885 115.04 29.9863 116.585 29.9863C118.131 29.9863 119.651 30.3885 121 31.1544L143.75 44.1344C145.361 45.0595 146.701 46.4024 147.634 48.0258C148.567 49.6492 149.058 51.495 149.058 53.3744C149.058 55.2538 148.567 57.0996 147.634 58.723C146.701 60.3464 145.361 61.6893 143.75 62.6144L77.7747 100.344C76.4216 101.128 74.8908 101.54 73.3331 101.54C71.7753 101.54 70.2445 101.128 68.8914 100.344L46.2497 87.3644C44.6385 86.4393 43.2981 85.0964 42.3655 83.473C41.4328 81.8496 40.9414 80.0038 40.9414 78.1244C40.9414 76.245 41.4328 74.3992 42.3655 72.7758C43.2981 71.1524 44.6385 69.8095 46.2497 68.8844L112.171 31.1544Z" stroke="#D1D1D1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M138.334 90.5V111.785C138.336 113.861 137.776 115.898 136.716 117.673C135.656 119.448 134.135 120.893 132.321 121.85L99.8212 138.79C98.3321 139.576 96.6785 139.986 95.0003 139.986C93.3221 139.986 91.6686 139.576 90.1795 138.79L57.6795 121.85C55.8654 120.893 54.3452 119.448 53.2848 117.673C52.2245 115.898 51.6649 113.861 51.667 111.785V90.5" stroke="#D1D1D1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h4 style="color: #2D2D8E; margin-top: 20px;">No Enrolled Courses Yet</h4>
                    <p style="color: #2D2D8E;">Your learning journey starts here! Browse courses to get started.</p>
                    <button class="btn-sidebar-browse" onclick="location.href='browse.html'">Browse Courses</button>
                </div>`;
        } else {
            container.innerHTML = myCourses.map(c => `
                <div class="sidebar-course-card">
                    <img src="${c.image}" alt="">
                    <div class="sidebar-card-info">
                        <p class="instructor-name">Instructor: Expert</p>
                        <h4>${c.title}</h4>
                        <div class="meta-info">
                            <span><i class="far fa-calendar"></i> ${c.day || 'Mon'}</span>
                            <span><i class="far fa-clock"></i> ${c.time || '18:00'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // --- UI МАРТВА (LoggedIn UI) ---
    function renderLoggedInUI(isLoggedIn) {
        const wrapper = document.getElementById('main-wrapper'); 
        const enrolledLink = document.getElementById('enrolled-link');
        const lockContainer = document.querySelector('.lock-container');
        const loginBtnHeader = document.querySelector('.btn-login');
        const signupBtnHeader = document.querySelector('.btn-signup');
        const profileIcon = document.getElementById('header-profile-icon');

        if (isLoggedIn) {
            if (wrapper) wrapper.classList.add('logged-in');
            if (loginBtnHeader) loginBtnHeader.style.display = 'none';
            if (signupBtnHeader) signupBtnHeader.style.display = 'none';
            if (profileIcon) profileIcon.style.display = 'block';
            if (enrolledLink) enrolledLink.style.display = 'flex';

            if (lockContainer) {
                lockContainer.classList.add('is-unlocked');
                const blurred = lockContainer.querySelector('.blurred-content');
                if (blurred) { 
                    blurred.style.filter = 'none'; 
                    blurred.style.opacity = '1'; 
                    blurred.style.pointerEvents = 'all';
                }
                const overlay = lockContainer.querySelector('.lock-overlay');
                if (overlay) overlay.style.display = 'none';
            }
            fetchUserData(); // ტოკენით ინფორმაციის წამოღება
        }
    }

    // --- ღილაკების ივენთები (Button Events) ---
    const btnLogin = document.querySelector('.btn-login');
    const btnSignup = document.querySelector('.btn-signup');
    const btnLoginLarge = document.querySelector('.btn-login-large');
    const profileIcon = document.getElementById('header-profile-icon');

    if (btnLogin) btnLogin.addEventListener('click', () => openModal('modal-login'));
    if (btnSignup) btnSignup.addEventListener('click', () => openModal('modal-signup-1'));
    if (btnLoginLarge) btnLoginLarge.addEventListener('click', () => openModal('modal-login'));
    if (profileIcon) profileIcon.addEventListener('click', () => openModal('modal-profile'));

    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
    if(modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    // საწყისი შემოწმება
    const savedStatus = localStorage.getItem('isLoggedIn') === 'true';
    renderLoggedInUI(savedStatus);
});