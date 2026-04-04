document.addEventListener('DOMContentLoaded', () => {
    
    // --- ПЕРЕМЕННЫЕ И СЛАЙДЕР ---
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');
    let currentIndex = 0;

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

    // --- МОДАЛЬНЫЕ ОКНА ---
    const modalOverlay = document.getElementById('modal-overlay');
    const allModals = document.querySelectorAll('.modal-card');
    
    const btnLogin = document.querySelector('.btn-login');
    const btnSignup = document.querySelector('.btn-signup');
    const btnLoginLarge = document.querySelector('.btn-login-large');
    const headerProfileIcon = document.getElementById('header-profile-icon');
    const closeBtns = document.querySelectorAll('.close-modal');

    function openModal(modalId) {
        if (!document.getElementById(modalId)) return;
        modalOverlay.style.display = 'flex';
        allModals.forEach(modal => modal.style.display = 'none');
        document.getElementById(modalId).style.display = 'block';

        if (modalId.startsWith('modal-signup-')) {
            const step = parseInt(modalId.split('-')[2]);
            updateStepNavigation(step);
        }

        if (modalId === 'modal-profile') {
            updateProfileStatus();
        }
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        clearErrors();
    }

    if (btnLogin) btnLogin.addEventListener('click', () => openModal('modal-login'));
    if (btnSignup) btnSignup.addEventListener('click', () => openModal('modal-signup-1'));
    if (btnLoginLarge) btnLoginLarge.addEventListener('click', () => openModal('modal-login'));
    if (headerProfileIcon) headerProfileIcon.addEventListener('click', () => openModal('modal-profile'));

    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // --- НАВИГАЦИЯ ВНУТРИ МОДАЛОК (СТРЕЛКИ И СЕГМЕНТЫ) ---
    function updateStepNavigation(currentStep) {
        const modal = document.getElementById(`modal-signup-${currentStep}`);
        if (!modal) return;

        const leftArrow = modal.querySelector('.prev-step');
        const rightArrow = modal.querySelector('.next-step');
        const segments = modal.querySelectorAll('.step-segment');

        if (leftArrow) {
            leftArrow.disabled = (currentStep === 1);
            leftArrow.onclick = () => openModal(`modal-signup-${currentStep - 1}`);
        }

        if (rightArrow) {
            rightArrow.disabled = (currentStep === 3);
            rightArrow.onclick = () => openModal(`modal-signup-${currentStep + 1}`);
        }

        segments.forEach((seg, index) => {
            seg.style.cursor = 'pointer';
            seg.onclick = () => openModal(`modal-signup-${index + 1}`);
        });
    }

    // --- УЛУЧШЕННАЯ ВАЛИДАЦИЯ ---
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

    // ЛОГИКА ОЧИСТКИ ОШИБКИ ПРИ ВВОДЕ (INPUT EVENT)
    document.querySelectorAll('.form-group input').forEach(input => {
        input.addEventListener('input', () => {
            const group = input.closest('.form-group');
            if (group.classList.contains('has-error')) {
                group.classList.remove('has-error');
                input.classList.remove('input-error');
                const errorSpan = group.querySelector('.error-msg');
                if (errorSpan) errorSpan.style.display = 'none';
            }
        });
    });

    // --- ШАГИ РЕГИСТРАЦИИ ---
    const next1 = document.getElementById('btn-signup-next-1');
    const next2 = document.getElementById('btn-signup-next-2');
    const finishSignup = document.getElementById('btn-signup-finish');

    if (next1) {
        next1.addEventListener('click', () => {
            clearErrors();
            const email = document.getElementById('signup-email').value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('signup-email', 'Please enter a valid email address');
            } else {
                openModal('modal-signup-2');
            }
        });
    }

    if (next2) {
        next2.addEventListener('click', () => {
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
    }

    // --- ЗАГРУЗКА АВАТАРА (НОВЫЙ ВИД) ---
    const avatarInput = document.getElementById('avatar-input');
    const avatarTrigger = document.getElementById('avatar-upload-trigger');
    const headerProfileIconImg = document.getElementById('header-profile-icon');
    const profileModalImg = document.getElementById('profile-img-preview');

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

            reader.onload = function(e) {
                const result = e.target.result;
                avatarTrigger.innerHTML = `
                    <div class="file-info-display">
                        <img src="${result}" alt="preview">
                        <div class="file-details">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">Size - ${fileSizeMB}MB</span>
                            <span class="change-link" id="change-photo-link">Change</span>
                        </div>
                    </div>
                `;

                document.getElementById('change-photo-link').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    avatarInput.click();
                });

                if (headerProfileIconImg) headerProfileIconImg.src = result;
                if (profileModalImg) profileModalImg.src = result;
            }
            reader.readAsDataURL(file);
        }
    }

    if (avatarTrigger && avatarInput) {
        avatarTrigger.addEventListener('click', () => {
            if (!document.getElementById('change-photo-link')) {
                avatarInput.click();
            }
        });
        avatarInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            avatarTrigger.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        avatarTrigger.addEventListener('dragover', () => avatarTrigger.classList.add('dragover'));
        avatarTrigger.addEventListener('dragleave', () => avatarTrigger.classList.remove('dragover'));
        avatarTrigger.addEventListener('drop', (e) => {
            avatarTrigger.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            handleFile(file);
        });
    }

    // --- СТАТУС ПРОФИЛЯ ---
    function updateProfileStatus() {
        const statusBadge = document.querySelector('.status-badge');
        const name = document.getElementById('profile-fullname').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        const age = document.getElementById('profile-age').value.trim();

        if (statusBadge) {
            if (name && phone && age) {
                statusBadge.textContent = "Profile Complete";
                statusBadge.className = "status-badge complete";
            } else {
                statusBadge.textContent = "Incomplete Profile";
                statusBadge.className = "status-badge incomplete";
            }
        }
    }

    // --- ОБНОВЛЕНИЕ ПРОФИЛЯ ---
    const btnUpdateProfile = document.getElementById('btn-update-profile');
    const profileFullnameInput = document.getElementById('profile-fullname');
    const displayUsername = document.getElementById('display-username');
    const signupUsernameInput = document.getElementById('signup-username');

    if (btnUpdateProfile) {
        btnUpdateProfile.addEventListener('click', () => {
            const newName = profileFullnameInput.value.trim();
            if (newName !== "") {
                if (displayUsername) displayUsername.textContent = newName;
                updateProfileStatus();
                closeModal();
            } else {
                showError('profile-fullname', 'Please enter your name');
            }
        });
    }

    // --- АВТОРИЗАЦИЯ ---
    const loginSubmit = document.getElementById('btn-login-submit');

    function handleAuthSuccess() {
        const regName = signupUsernameInput.value.trim();
        if (regName !== "") {
            if (displayUsername) displayUsername.textContent = regName;
            if (profileFullnameInput) profileFullnameInput.value = regName;
        }
        closeModal();
        renderLoggedInUI(true);
    }

    if (loginSubmit) loginSubmit.addEventListener('click', handleAuthSuccess);
    if (finishSignup) finishSignup.addEventListener('click', handleAuthSuccess);

    function renderLoggedInUI(isLoggedIn) {
        const enrolledLink = document.getElementById('enrolled-link');
        const lockContainer = document.querySelector('.lock-container');
        const loginBtnHeader = document.querySelector('.btn-login');
        const signupBtnHeader = document.querySelector('.btn-signup');
        const profileIcon = document.getElementById('header-profile-icon');

        if (isLoggedIn) {
            if (loginBtnHeader) loginBtnHeader.style.display = 'none';
            if (signupBtnHeader) signupBtnHeader.style.display = 'none';
            if (profileIcon) profileIcon.style.display = 'block';
            if (enrolledLink) enrolledLink.style.display = 'flex';
            if (lockContainer) {
                lockContainer.style.border = 'none';
                const blurred = document.querySelector('.blurred-content');
                const overlay = document.querySelector('.lock-overlay');
                if (blurred) { blurred.style.filter = 'none'; blurred.style.opacity = '1'; }
                if (overlay) overlay.style.display = 'none';
            }
        } else {
            if (loginBtnHeader) loginBtnHeader.style.display = 'block';
            if (signupBtnHeader) signupBtnHeader.style.display = 'block';
            if (profileIcon) profileIcon.style.display = 'none';
            if (enrolledLink) enrolledLink.style.display = 'none';
        }
    }

    renderLoggedInUI(false);
});