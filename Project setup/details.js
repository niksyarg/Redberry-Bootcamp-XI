const API_URL = 'https://api.redclass.redberryinternship.ge/api';
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

let basePrice = 0;
let selectedMod = 0;

async function initDetails() {
    if (!courseId) return window.location.href = 'browse.html';

    try {
    
        const courseRes = await axios.get(`${API_URL}/courses/${courseId}`);
        const course = courseRes.data.data;
        
       
        basePrice = course.basePrice;
        
        // ეგრევე ვხატავთ ინფოს და ფასს (რომ $0 არ გამოჩნდეს)
        renderCourseInfo(course);
        updatePrice(); 

        // მერე წამოვიღოთ განრიგი
        const schedulesRes = await axios.get(`${API_URL}/courses/${courseId}/weekly-schedules`);
        renderWeeklySchedules(schedulesRes.data.data);
        
        checkAuthStatus();
    } catch (err) { 
        console.error("Error loading details:", err); 
    }
}


const shortDays = (l) => l.replace('Monday','Mon').replace('Tuesday','Tue').replace('Wednesday','Wed').replace('Thursday','Thu').replace('Friday','Fri').replace('Saturday','Sat').replace('Sunday','Sun');

function renderWeeklySchedules(data) {
    const container = document.getElementById('weekly-schedule-list');
    if(!container) return;
    container.innerHTML = data.map(i => `<button class="option-btn" data-id="${i.id}">${shortDays(i.label)}</button>`).join('');
    
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = async () => {
            handleStep(container, btn, 'step2');
            const res = await axios.get(`${API_URL}/courses/${courseId}/weekly-schedules/${btn.dataset.id}/time-slots`);
            renderTimeSlots(res.data.data);
        };
    });
}

function renderTimeSlots(data) {
    const container = document.getElementById('time-slot-list');
    container.innerHTML = data.map(i => `<button class="option-btn" data-id="${i.id}">${i.label}</button>`).join('');
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = async () => {
            handleStep(container, btn, 'step3');
            const res = await axios.get(`${API_URL}/courses/${courseId}/time-slots/${btn.dataset.id}/session-types`);
            renderSessionTypes(res.data.data);
        };
    });
}

function renderSessionTypes(data) {
    const container = document.getElementById('session-type-list');
    container.innerHTML = data.map(i => `<button class="option-btn" data-id="${i.id}" data-mod="${i.priceModifier}">${i.name}</button>`).join('');
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = () => {
            handleStep(container, btn);
            selectedMod = parseInt(btn.dataset.mod);
            updatePrice();
        };
    });
}

function handleStep(cont, btn, next = null) {
    cont.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (next) toggleAccordion(next);
}

function toggleAccordion(id) {
    document.querySelectorAll('.acc-item').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}

function updatePrice() {
    const total = basePrice + selectedMod;
    
    // ვამოწმებთ არსებობს თუ არა ელემენტები, რომ შეცდომა არ ამოაგდოს
    const totalPriceEl = document.getElementById('course-price');
    const basePriceEl = document.getElementById('base-p-val');
    const typePriceEl = document.getElementById('type-p-val');

    if(totalPriceEl) totalPriceEl.innerText = `$${total}`;
    if(basePriceEl) basePriceEl.innerText = `$${basePrice}`;
    if(typePriceEl) {
        typePriceEl.innerText = selectedMod > 0 ? `+ $${selectedMod}` : `+ $0`;
    }
    
    // Enroll ღილაკის გააქტიურება მხოლოდ თუ სესიის ტიპი არჩეულია
    const enrollBtn = document.getElementById('enroll-button');
    if(enrollBtn && selectedMod >= 0 && document.querySelector('#session-type-list .active')) {
        enrollBtn.disabled = false;
    }
}

function renderCourseInfo(c) {
    document.getElementById('course-name').innerText = c.title;
    document.getElementById('bc-title').innerText = c.title;
    document.getElementById('course-img').src = c.image;
    document.getElementById('course-duration').innerText = c.durationWeeks;
    document.getElementById('course-hours').innerText = c.durationWeeks * 8;
    document.getElementById('instr-name').innerText = c.instructor.name;
    document.getElementById('instr-avatar').src = c.instructor.avatar;
    document.getElementById('course-description').innerText = c.description;
    document.getElementById('course-cat-tag').innerText = c.category.name;
}

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const authNotice = document.getElementById('auth-notice');
    const priceCard = document.getElementById('price-card');
    
    if (isLoggedIn === 'true') {
        document.querySelector('.btn-login').style.display = 'none';
        document.querySelector('.btn-signup').style.display = 'none';
        document.getElementById('header-profile-icon').style.display = 'block';
        if (authNotice) authNotice.style.display = 'none';
        if (priceCard) priceCard.style.display = 'block';
    } else {
        if (authNotice) authNotice.style.display = 'flex';
        if (priceCard) priceCard.style.display = 'none';
    }
}

initDetails();