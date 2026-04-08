const API_URL = 'https://api.redclass.redberryinternship.ge/api';

let allCourses = [];
let allInstructors = [];
let activeFilters = {
    categoryId: null,
    instructorId: null,
    topicName: null
};

async function initPage() {
    try {
        const [catRes, topRes, instRes, courseRes] = await Promise.all([
            axios.get(`${API_URL}/categories`),
            axios.get(`${API_URL}/topics`),
            axios.get(`${API_URL}/instructors`),
            axios.get(`${API_URL}/courses`)
        ]);

        allCourses = courseRes.data.data;
        allInstructors = instRes.data.data;

        renderCategories(catRes.data.data);
        renderTopics(topRes.data.data);
        renderInstructors(allInstructors);
        applyFilters(); 
        renderPagination();
        
        checkAuthStatus();

    } catch (err) {
        console.error("მონაცემების ჩატვირთვა ვერ მოხერხდა:", err);
    }
}

function renderCategories(data) {
    const div = document.getElementById('categoryList');
    if (!div) return;
    div.innerHTML = data.map(c => `<button class="category-btn" data-id="${c.id}">${c.name}</button>`).join('');
    
    div.querySelectorAll('.category-btn').forEach(btn => {
        btn.onclick = () => toggleFilter(div, btn, 'categoryId', '.category-btn');
    });
}

function renderTopics(data) {
    const div = document.getElementById('topicList');
    if (!div) return;
    div.innerHTML = data.map(t => `<button class="topic-pill" data-name="${t.name}">${t.name}</button>`).join('');
    
    div.querySelectorAll('.topic-pill').forEach(btn => {
        btn.onclick = () => {
            const isActive = btn.classList.contains('active');
            div.querySelectorAll('.topic-pill').forEach(b => b.classList.remove('active'));
            if (isActive) {
                activeFilters.topicName = null;
            } else {
                btn.classList.add('active');
                activeFilters.topicName = btn.dataset.name;
            }
            applyFilters();
        };
    });
}

function renderInstructors(data) {
    const div = document.getElementById('instructorList');
    if (!div) return;
    div.innerHTML = data.map(i => `
        <div class="instructor-item" data-id="${i.id}">
            <img src="${i.avatar}"> <span>${i.name}</span>
        </div>
    `).join('');
    
    div.querySelectorAll('.instructor-item').forEach(item => {
        item.onclick = () => toggleFilter(div, item, 'instructorId', '.instructor-item');
    });
}

// აი აქ ჩავასწორე ღილაკის ლოგიკა!
function renderCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    const countLabel = document.getElementById('resultsCount');
    if (countLabel) countLabel.innerText = `Showing ${courses.length} out of 90`;
    
    if (!grid) return;
    if (courses.length === 0) {
        grid.innerHTML = "<h3 style='grid-column: 1/-1; text-align: center; margin-top: 50px;'>No courses found matching these filters.</h3>";
        return;
    }

    grid.innerHTML = courses.map(course => {
        const instructor = allInstructors.find(ins => ins.id === course.instructor_id);
        const instructorName = instructor ? instructor.name : "Expert Instructor";

        // ლექტორის ნათქვამი onclick აქ არის ჩასმული:
        return `
        <div class="course-card">
            <img src="${course.image}" class="card-banner">
            <div class="card-body">
                <div class="meta">
                    <span>${instructorName}</span> 
                    <span>⭐ 4.9</span>
                </div>
                <h3>${course.title}</h3>
                <div class="card-footer">
                    <span class="price">Starting from <span class="amount">$${course.price}</span></span>
                    <button class="btn-details" onclick="window.location.href='details.html?id=${course.id}'">Details</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function applyFilters() {
    let result = [...allCourses];

    if (activeFilters.categoryId) {
        result = result.filter(c => String(c.category_id) === String(activeFilters.categoryId));
    }
    if (activeFilters.instructorId) {
        result = result.filter(c => String(c.instructor_id) === String(activeFilters.instructorId));
    }
    if (activeFilters.topicName) {
        result = result.filter(c => c.title.toLowerCase().includes(activeFilters.topicName.toLowerCase()));
    }

    const sortElement = document.getElementById('sortCourses');
    const sortValue = sortElement ? sortElement.value : 'newest';
    
    if (sortValue === 'low-to-high') result.sort((a, b) => a.price - b.price);
    else if (sortValue === 'high-to-low') result.sort((a, b) => b.price - a.price);
    else if (sortValue === 'newest') result.sort((a, b) => b.id - a.id);

    renderCourses(result);
}

function toggleFilter(parent, el, key, selector) {
    const isAct = el.classList.contains('active');
    parent.querySelectorAll(selector).forEach(a => a.classList.remove('active'));
    if (isAct) {
        activeFilters[key] = null;
    } else {
        el.classList.add('active');
        activeFilters[key] = el.dataset.id;
    }
    applyFilters();
}

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const savedAvatar = localStorage.getItem('userAvatar');
    
    if (isLoggedIn === 'true') {
        const loginBtn = document.querySelector('.btn-login');
        const signupBtn = document.querySelector('.btn-signup');
        const profileIcon = document.getElementById('header-profile-icon');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        
        if (profileIcon) {
            profileIcon.style.display = 'block';
            if (savedAvatar) profileIcon.src = savedAvatar;
        }
    }
}

// Event Listeners
if (document.getElementById('sortCourses')) {
    document.getElementById('sortCourses').onchange = applyFilters;
}

if (document.getElementById('clearFilters')) {
    document.getElementById('clearFilters').onclick = () => {
        activeFilters = { categoryId: null, instructorId: null, topicName: null };
        document.querySelectorAll('.active').forEach(a => a.classList.remove('active'));
        applyFilters();
    };
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    pagination.innerHTML = `
        <button class="page-btn"><</button>
        <button class="page-btn active">1</button>
        <button class="page-btn">2</button>
        <button class="page-btn">3</button>
        <span>...</span>
        <button class="page-btn">10</button>
        <button class="page-btn">></button>
    `;
}

initPage();