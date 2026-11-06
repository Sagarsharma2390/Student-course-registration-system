/**
 * STUDENT COURSE REGISTRATION SYSTEM (SCRS)
 * Student Workflow Handler: Registration, Login & Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Student Registration Form
    const registerForm = document.getElementById('student-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleStudentRegister);
    }

    // 2. Student Login Form
    const loginForm = document.getElementById('student-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleStudentLogin);
    }

    // 3. Student Dashboard View
    const dashboardView = document.getElementById('student-dashboard-page');
    if (dashboardView) {
        initStudentDashboard();
    }
});

/**
 * Handle Student Registration
 */
async function handleStudentRegister(e) {
    e.preventDefault();
    const alertBox = document.getElementById('auth-alert');
    const submitBtn = document.getElementById('submit-btn');

    if (alertBox) alertBox.style.display = 'none';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const department = document.getElementById('department').value.trim();
    const semester = document.getElementById('semester').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!name || !email || !phone || !department || !semester || !password || !confirmPassword) {
        showAuthAlert('Please fill in all required fields.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAuthAlert('Please enter a valid email address.', 'error');
        return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showAuthAlert('Phone number must be a valid 10-digit number.', 'error');
        return;
    }

    const semNum = parseInt(semester, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
        showAuthAlert('Semester must be between 1 and 8.', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthAlert('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAuthAlert('Passwords do not match. Please re-enter.', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const payload = {
            name,
            email,
            phone,
            department,
            semester: semNum,
            password
        };

        const result = await apiRequest('/students/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        showToast(result.message || 'Student registered successfully!', 'success');
        showAuthAlert('Registration successful! Redirecting to login...', 'success');

        setTimeout(() => {
            window.location.href = '/student/login.html';
        }, 1500);

    } catch (error) {
        showAuthAlert(error.message || 'Failed to complete registration.', 'error');
    } finally {
        setButtonLoading(submitBtn, false, 'Complete Registration');
    }
}

/**
 * Handle Student Login
 */
async function handleStudentLogin(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('login-btn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showAuthAlert('Please enter both email and password.', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const result = await apiRequest('/students/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success && result.student) {
            setStudentSession(result.student);
            showToast('Welcome back, ' + result.student.name, 'success');
            setTimeout(() => {
                window.location.href = '/student/dashboard.html';
            }, 600);
        }
    } catch (error) {
        showAuthAlert(error.message || 'Invalid email or password.', 'error');
    } finally {
        setButtonLoading(submitBtn, false, 'Sign In to Portal');
    }
}

/**
 * Initialize Student Dashboard Statistics & Quick Cards
 */
async function initStudentDashboard() {
    const student = requireStudentAuth();
    if (!student) return;

    try {
        // Fetch all courses and student's registrations concurrently
        const [coursesRes, registrationsRes] = await Promise.all([
            apiRequest('/courses'),
            apiRequest(`/registrations/student/${student.student_id}`)
        ]);

        const allCourses = coursesRes.data || [];
        const myRegistrations = registrationsRes.data || [];

        // Compute metrics
        const totalAvailable = allCourses.length;
        const totalEnrolled = myRegistrations.length;
        const activeCount = myRegistrations.filter(r => r.status === 'Active').length;
        const cancelledCount = myRegistrations.filter(r => r.status === 'Cancelled').length;

        // Update Stat Cards in DOM
        const elAvailable = document.getElementById('stat-available-courses');
        const elMyCourses = document.getElementById('stat-my-courses');
        const elActive = document.getElementById('stat-active-courses');
        const elCancelled = document.getElementById('stat-cancelled-courses');

        if (elAvailable) elAvailable.textContent = totalAvailable;
        if (elMyCourses) elMyCourses.textContent = totalEnrolled;
        if (elActive) elActive.textContent = activeCount;
        if (elCancelled) elCancelled.textContent = cancelledCount;

        // Render Recommended / Available Courses Preview
        renderDashboardCoursesPreview(allCourses, myRegistrations, student.student_id);

    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Failed to load dashboard data.', 'error');
    }
}

/**
 * Render Quick Courses on Dashboard
 */
function renderDashboardCoursesPreview(allCourses, myRegistrations, studentId) {
    const container = document.getElementById('dashboard-courses-preview');
    if (!container) return;

    const registeredCourseIds = new Set(
        myRegistrations.map(r => r.course_id)
    );

    if (allCourses.length === 0) {
        container.innerHTML = `<p class="text-muted">No courses currently available.</p>`;
        return;
    }

    container.innerHTML = allCourses.slice(0, 4).map(course => {
        const isRegistered = registeredCourseIds.has(course.course_id);
        return `
            <div class="course-card">
                <div>
                    <div class="course-card-header">
                        <span class="course-code">COURSE #${course.course_id}</span>
                        <span class="badge badge-dept">${course.department}</span>
                    </div>
                    <h3 class="course-title">${course.course_name}</h3>
                    <div class="course-meta">
                        <div class="course-meta-row">
                            <span>👨‍🏫 Faculty:</span>
                            <strong>${course.faculty_name || 'Department Assigned'}</strong>
                        </div>
                        <div class="course-meta-row">
                            <span>📅 Semester:</span>
                            <span>Semester ${course.semester}</span>
                        </div>
                    </div>
                </div>
                <div class="course-footer">
                    <span class="badge badge-credits">${course.credits} Credits</span>
                    ${isRegistered ? `
                        <span class="badge badge-active">Enrolled</span>
                    ` : `
                        <button class="btn btn-primary btn-sm" onclick="quickRegisterCourse(${studentId}, ${course.course_id})">
                            Register Course
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Quick Register Course from Dashboard
 */
async function quickRegisterCourse(studentId, courseId) {
    if (!confirm('Are you sure you want to enroll in this course?')) return;

    try {
        const result = await apiRequest('/registrations', {
            method: 'POST',
            body: JSON.stringify({
                student_id: studentId,
                course_id: courseId
            })
        });

        showToast(result.message || 'Course registered successfully!', 'success');
        // Refresh dashboard
        setTimeout(() => {
            initStudentDashboard();
        }, 800);
    } catch (error) {
        showToast(error.message || 'Unable to register for course.', 'error');
    }
}

/**
 * UI Alert Helper for Auth forms
 */
function showAuthAlert(msg, type = 'error') {
    const alertBox = document.getElementById('auth-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `auth-alert auth-alert-${type}`;
    alertBox.style.display = 'block';
}

