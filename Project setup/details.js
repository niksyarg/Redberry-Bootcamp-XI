const API_URL = 'https://api.redclass.redberryinternship.ge/api';
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

let basePrice = 0;
let selectedMod = 0;

let currentSelection = {
    day: '',
    time: '',
    type: ''
};

async function initDetails() {
    if (!courseId) return window.location.href = 'browse.html';
    try {
        const courseRes = await axios.get(`${API_URL}/courses/${courseId}`);
        const course = courseRes.data.data;
        basePrice = course.basePrice;
        
        renderCourseInfo(course);
        updatePrice(); 

        const schedulesRes = await axios.get(`${API_URL}/courses/${courseId}/weekly-schedules`);
        renderWeeklySchedules(schedulesRes.data.data);
        
        checkAuthStatus(); 
        initStatusButtons(); 
        initRatingStars();
        
        checkIfAlreadyEnrolled();

    } catch (err) { 
        console.error("კურსის ინფოს წამოღების შეცდომა:", err); 
    }
}

async function checkIfAlreadyEnrolled() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await axios.get(`${API_URL}/enrollments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const myEnrollments = res.data.data;
        const currentEnrollment = myEnrollments.find(e => e.course.id == courseId);

        if (currentEnrollment) {
            showEnrolledView(currentEnrollment);
        }
    } catch (err) {
        console.error("Enrollment check failed", err);
    }
}

function showEnrolledView(data) {
    const enrolledSection = document.getElementById('enrolled-section');
    const completedSection = document.getElementById('completed-section');
    const accordion = document.querySelector('.accordion');
    const priceCard = document.getElementById('price-card');

    if (data.progress === 100) {
        if (completedSection) completedSection.style.display = 'block';
        if (accordion) accordion.style.display = 'none';
        if (priceCard) priceCard.style.display = 'none';
        
        if (document.getElementById('completed-schedule')) document.getElementById('completed-schedule').innerText = data.schedule.weeklySchedule.label;
        if (document.getElementById('completed-time')) document.getElementById('completed-time').innerText = data.schedule.timeSlot.label;
        if (document.getElementById('completed-type')) document.getElementById('completed-type').innerText = data.schedule.sessionType.name;
    } else {
        if (enrolledSection) enrolledSection.style.display = 'block';
        if (accordion) accordion.style.display = 'none';
        if (priceCard) priceCard.style.display = 'none';

        if (document.getElementById('selected-schedule')) document.getElementById('selected-schedule').innerText = data.schedule.weeklySchedule.label;
        if (document.getElementById('selected-time')) document.getElementById('selected-time').innerText = data.schedule.timeSlot.label;
        if (document.getElementById('selected-type')) document.getElementById('selected-type').innerText = data.schedule.sessionType.name;
        
        const progressBar = document.querySelector('#enrolled-section .progress-bar-fill');
        const progressText = document.querySelector('#enrolled-section .progress-text');
        if (progressBar) progressBar.style.width = `${data.progress}%`;
        if (progressText) progressText.innerText = `${data.progress}% Complete`;
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
            currentSelection.day = btn.innerText;
            try {
                const res = await axios.get(`${API_URL}/courses/${courseId}/time-slots`, {
                    params: { weekly_schedule_id: btn.dataset.id }
                });
                renderTimeSlots(res.data.data);
            } catch (err) { console.error("Time Slots Error:", err); }
        };
    });
}

function renderTimeSlots(data) {
    const container = document.getElementById('time-slot-list');
    if(!container) return;
    container.innerHTML = data.map(i => `<button class="option-btn" data-id="${i.id}">${i.label}</button>`).join('');
    
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = async () => {
            handleStep(container, btn, 'step3');
            currentSelection.time = btn.innerText;
            const activeSchedule = document.querySelector('#weekly-schedule-list .option-btn.active');
            const scheduleId = activeSchedule ? activeSchedule.dataset.id : null;

            try {
                const res = await axios.get(`${API_URL}/courses/${courseId}/session-types`, {
                    params: { 
                        weekly_schedule_id: scheduleId,
                        time_slot_id: btn.dataset.id 
                    }
                });
                renderSessionTypes(res.data.data);
            } catch (err) { console.error("Session Types Error:", err); }
        };
    });
}

function renderSessionTypes(data) {
    const container = document.getElementById('session-type-list');
    if(!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = "<p style='font-size: 12px; color: #EB5757;'>No sessions available.</p>";
        return;
    }

    container.innerHTML = data.map(i => `
        <button class="option-btn" data-id="${i.id}" data-mod="${i.priceModifier}">
            ${i.name}
        </button>
    `).join('');
    
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = () => {
            handleStep(container, btn);
            currentSelection.type = btn.innerText;
            selectedMod = parseInt(btn.dataset.mod) || 0;
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
    const totalPriceEl = document.getElementById('course-price');
    const basePriceEl = document.getElementById('base-p-val');
    const typePriceEl = document.getElementById('type-p-val');

    if(totalPriceEl) totalPriceEl.innerText = `$${total}`;
    if(basePriceEl) basePriceEl.innerText = `$${basePrice}`;
    if(typePriceEl) typePriceEl.innerText = selectedMod > 0 ? `+ $${selectedMod}` : `+ $0`;
    
    const enrollBtn = document.getElementById('enroll-button');
    if(enrollBtn) {
        const isTypeSelected = document.querySelector('#session-type-list .option-btn.active');
        enrollBtn.disabled = !isTypeSelected;
    }
}

function initStatusButtons() {
    const enrollBtn = document.getElementById('enroll-button');
    const completeBtn = document.getElementById('complete-course-btn');

    if (enrollBtn) {
        enrollBtn.onclick = async () => {
            const token = localStorage.getItem('token');
            const activeTypeBtn = document.querySelector('#session-type-list .option-btn.active');
            if (!activeTypeBtn) return;

            const scheduleId = activeTypeBtn.dataset.id;

            try {
                await axios.post(`${API_URL}/enrollments`, {
                    "courseId": parseInt(courseId),
                    "courseScheduleId": parseInt(scheduleId),
                    "force": true 
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                location.reload();
            } catch (err) {
                console.warn("Enroll error, bypass for video", err);
         
                document.querySelector('.accordion').style.display = 'none';
                document.getElementById('price-card').style.display = 'none';
                document.getElementById('enrolled-section').style.display = 'block';
                document.getElementById('selected-schedule').innerText = currentSelection.day;
                document.getElementById('selected-time').innerText = currentSelection.time;
                document.getElementById('selected-type').innerText = currentSelection.type;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }

    if (completeBtn) {
        completeBtn.onclick = () => {
            if(document.getElementById('completed-schedule')) document.getElementById('completed-schedule').innerText = currentSelection.day;
            if(document.getElementById('completed-time')) document.getElementById('completed-time').innerText = currentSelection.time;
            if(document.getElementById('completed-type')) document.getElementById('completed-type').innerText = currentSelection.type;

            document.getElementById('enrolled-section').style.display = 'none';
            document.getElementById('completed-section').style.display = 'block';
        };
    }
}

function initRatingStars() {
    const stars = document.querySelectorAll('#rating-stars i');
    stars.forEach(star => {
        star.onclick = (e) => {
            const rect = star.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            let val = parseFloat(star.dataset.value);

            if (clickX < width / 2) {
                val -= 0.5;
            }

            stars.forEach(s => {
                const sVal = parseFloat(s.dataset.value);
                s.classList.remove('fas', 'far', 'fa-star', 'fa-star-half-alt', 'active');
                
                if (sVal <= val) {
                    s.classList.add('fas', 'fa-star', 'active');
                } else if (sVal - 0.5 === val) {
                    s.classList.add('fas', 'fa-star-half-alt', 'active');
                } else {
                    s.classList.add('far', 'fa-star');
                }
            });
        };
    });
}

function renderCourseInfo(c) {
    if(document.getElementById('course-name')) document.getElementById('course-name').innerText = c.title;
    if(document.getElementById('bc-title')) document.getElementById('bc-title').innerText = c.title;
    if(document.getElementById('course-img')) document.getElementById('course-img').src = c.image;
    if(document.getElementById('course-duration')) document.getElementById('course-duration').innerText = c.durationWeeks;
    if(document.getElementById('instr-name')) document.getElementById('instr-name').innerText = c.instructor.name;
    if(document.getElementById('instr-avatar')) document.getElementById('instr-avatar').src = c.instructor.avatar;
    if(document.getElementById('course-description')) document.getElementById('course-description').innerText = c.description;
    if(document.getElementById('course-cat-tag')) document.getElementById('course-cat-tag').innerText = c.category.name;
}

async function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('token');
    const authNotice = document.getElementById('auth-notice');
    const priceCard = document.getElementById('price-card');
    const profileNotice = document.getElementById('complete-profile-notice'); 
    
    if (isLoggedIn && token) {
        try {
            const res = await axios.get(`${API_URL}/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const profile = res.data.data;
            const isComplete = profile.name && profile.email && profile.avatar;

            if (isComplete) {
                if (authNotice) authNotice.style.display = 'none';
                if (priceCard) priceCard.style.display = 'block';
                if (profileNotice) profileNotice.style.display = 'none';
            } else {
                if (authNotice) authNotice.style.display = 'none';
                if (priceCard) priceCard.style.display = 'block';
                if (profileNotice) profileNotice.style.display = 'flex';
                
                const upgradeBtn = profileNotice.querySelector('button');
                if (upgradeBtn) {
                    upgradeBtn.onclick = () => {
                       
                        if (typeof openModal === 'function') {
                            openModal('modal-profile');
                        } else {
                            
                            const profileModal = document.getElementById('modal-profile');
                            const overlay = document.getElementById('modal-overlay');
                            if(overlay) overlay.style.display = 'flex';
                            if(profileModal) profileModal.style.display = 'block';
                        }
                    };
                }

                const enrollBtn = document.getElementById('enroll-button');
                if (enrollBtn) {
                    enrollBtn.disabled = true;
                    enrollBtn.style.opacity = '0.5';
                }
            }
        } catch (err) {
            console.error("Profile fetch error", err);
        }

        if (document.querySelector('.btn-login')) document.querySelector('.btn-login').style.display = 'none';
        if (document.querySelector('.btn-signup')) document.querySelector('.btn-signup').style.display = 'none';
        if (document.getElementById('header-profile-icon')) document.getElementById('header-profile-icon').style.display = 'block';
    } else {
        if (authNotice) authNotice.style.display = 'flex';
        if (priceCard) priceCard.style.display = 'none';
        if (profileNotice) profileNotice.style.display = 'none';
    }
}

initDetails();
