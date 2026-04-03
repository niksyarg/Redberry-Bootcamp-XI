document.addEventListener('DOMContentLoaded', () => {
    // 1. Логика Слайдера
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');
    let currentIndex = 0;

    function updateSlider(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        
        currentIndex = (index + slides.length) % slides.length;
        
        slides[currentIndex].classList.add('active');
        dots[currentIndex].classList.add('active');
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => updateSlider(currentIndex + 1));
        prevBtn.addEventListener('click', () => updateSlider(currentIndex - 1));
    }

    // Клик по точкам
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => updateSlider(i));
    });

    // 2. Логика для неавторизованного пользователя
    // Поменяй на true, когда сделаешь систему входа
    const isUserLoggedIn = false; 

    const enrolledLink = document.getElementById('enrolled-link');
    const lockContainer = document.querySelector('.lock-container');

    if (isUserLoggedIn) {
        // Если вошел: скрываем надпись Enrolled Courses
        if (enrolledLink) enrolledLink.style.display = 'none';
        
        // Убираем туман и замок
        if (lockContainer) {
            lockContainer.style.border = 'none';
            document.querySelector('.blurred-content').style.filter = 'none';
            document.querySelector('.blurred-content').style.opacity = '1';
            document.querySelector('.lock-overlay').style.display = 'none';
        }
    } else {
        // Если не вошел: надпись видна
        if (enrolledLink) enrolledLink.style.display = 'flex';
    }
});