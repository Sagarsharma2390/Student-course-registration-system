/**
 * STUDENT COURSE REGISTRATION SYSTEM (SCRS)
 * Course Catalog, Filtering & Registration Operations
 */

let allCoursesList = [];
let studentRegistrationsSet = new Set();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Available Courses Page (Student)
    const coursesPage = document.getElementById('student-courses-page');
    if (coursesPage) {
        initStudentCoursesPage();
    }

    // 2. Admin Add Course Form
    const addCourseForm = document.getElementById('add-course-form');
    if (addCourseForm) {
        initAddCourseForm();
    }
});

/**
 * Initialize Student Courses Catalog Page
 */
async function initStudentCoursesPage() {
    const student = requireStudentAuth();
    if (!student) return;

    const searchInput = document.getElementById('search-course');
    const deptFilter = document.getElementById('filter-dept');
    const semFilter = document.getElementById('filter-sem');

    if (searchInput) searchInput.addEventListener('input', filterAndRenderCourses);
    if (deptFilter) deptFilter.addEventListener('change', filterAndRenderCourses);
    if (semFilter) semFilter.addEventListener('change', filterAndRenderCourses);

    try {
        // Fetch courses and existing enrollments concurrently
        const [coursesRes, regsRes] = await Promise.all([
            apiRequest('/courses'),
            apiRequest(`/registrations/student/${student.student_id}`)
        ]);

        allCoursesList = coursesRes.data || [];
        const myRegs = regsRes.data || [];
        studentRegistrationsSet = new Set(myRegs.filter(r => r.status === 'Active').map(r => r.course_id));

        // Populate dynamic department filter options
        populateDepartmentOptions(allCoursesList);

        // Initial render
        filterAndRenderCourses();

    } catch (error) {
        console.error('Error loading course catalog:', error);
        showToast('Unable to load courses. Please check connection.', 'error');
    }
}

/**
 * Populate dynamic department dropdown filter
 */
function populateDepartmentOptions(courses) {
    const deptSelect = document.getElementById('filter-dept');
    if (!deptSelect) return;

    const depts = Array.from(new Set(courses.map(c => c.department).filter(Boolean)));
    depts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        deptSelect.appendChild(opt);
    });
}

/**
 * Filter & Render Courses in Grid
 */
function filterAndRenderCourses() {
    const searchVal = (document.getElementById('search-course')?.value || '').toLowerCase().trim();
    const deptVal = document.getElementById('filter-dept')?.value || '';
    const semVal = document.getElementById('filter-sem')?.value || '';

    const student = getLoggedInStudent();
    const studentId = student ? student.student_id : null;

    const filtered = allCoursesList.filter(c => {
        const matchesSearch = c.course_name.toLowerCase().includes(searchVal) ||
                              (c.faculty_name && c.faculty_name.toLowerCase().includes(searchVal));
        const matchesDept = !deptVal || c.department === deptVal;
        const matchesSem = !semVal || c.semester.toString() === semVal;

        return matchesSearch && matchesDept && matchesSem;
    });

    const grid = document.getElementById('courses-grid-container');
    const countBadge = document.getElementById('course-results-count');

    if (countBadge) {
        countBadge.textContent = `${filtered.length} course${filtered.length === 1 ? '' : 's'} found`;
    }

    if (!grid) return;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🔍</div>
                <h3 class="empty-title">No Matching Courses Found</h3>
                <p>Try refining your search terms or clearing selected filters.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(course => {
        const isRegistered = studentRegistrationsSet.has(course.course_id);
        return `
            <div class="course-card">
                <div>
                    <div class="course-card-header">
                        <span class="course-code">CRN #${course.course_id}</span>
                        <span class="badge badge-dept">${course.department}</span>
                    </div>
                    <h3 class="course-title">${course.course_name}</h3>
                    <div class="course-meta">
                        <div class="course-meta-row">
                            <span>👨‍🏫 Faculty:</span>
                            <strong>${course.faculty_name || 'Department Assigned'}</strong>
                        </div>
                        <div class="course-meta-row">
                            <span>📅 Term:</span>
                            <span>Semester ${course.semester}</span>
                        </div>
                        ${course.faculty_email ? `
                            <div class="course-meta-row" style="font-size:0.8rem;color:#64748b;">
                                <span>✉️ Contact:</span>
                                <span>${course.faculty_email}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="course-footer">
                    <span class="badge badge-credits">${course.credits} Credits</span>
                    ${isRegistered ? `
                        <span class="badge badge-active" style="padding:0.4rem 0.8rem;">Enrolled</span>
                    ` : `
                        <button class="btn btn-primary btn-sm" id="btn-reg-${course.course_id}" onclick="registerCourseAction(${studentId}, ${course.course_id})">
                            Register Course
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Handle Course Registration Action
 */
async function registerCourseAction(studentId, courseId) {
    if (!studentId) {
        showToast('Please login as a student to register.', 'warning');
        return;
    }

    const btn = document.getElementById(`btn-reg-${courseId}`);
    setButtonLoading(btn, true);

    try {
        const res = await apiRequest('/registrations', {
            method: 'POST',
            body: JSON.stringify({
                student_id: studentId,
                course_id: courseId
            })
        });

        showToast(res.message || 'Course registered successfully!', 'success');
        studentRegistrationsSet.add(courseId);
        filterAndRenderCourses();

    } catch (error) {
        showToast(error.message || 'Registration failed.', 'error');
        setButtonLoading(btn, false, 'Register Course');
    }
}

/**
 * Initialize Admin Add Course Form
 */
async function initAddCourseForm() {
    requireAdminAuth();
    const facultySelect = document.getElementById('faculty_id');

    // Populate faculty dropdown
    if (facultySelect) {
        try {
            const res = await apiRequest('/faculty');
            const facultyList = res.data || [];
            facultySelect.innerHTML = '<option value="">-- Select Faculty In-Charge --</option>' +
                facultyList.map(f => `
                    <option value="${f.faculty_id}">${f.faculty_name} (${f.department})</option>
                `).join('');
        } catch (err) {
            console.error('Failed to load faculty options:', err);
            showToast('Failed to load faculty list.', 'error');
        }
    }

    const form = document.getElementById('add-course-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-btn');

        const course_name = document.getElementById('course_name').value.trim();
        const credits = document.getElementById('credits').value;
        const department = document.getElementById('department').value.trim();
        const semester = document.getElementById('semester').value;
        const faculty_id = document.getElementById('faculty_id').value;

        if (!course_name || !credits || !department || !semester || !faculty_id) {
            showToast('All fields are required.', 'warning');
            return;
        }

        setButtonLoading(submitBtn, true);

        try {
            const res = await apiRequest('/courses', {
                method: 'POST',
                body: JSON.stringify({
                    course_name,
                    credits: parseInt(credits, 10),
                    department,
                    semester: parseInt(semester, 10),
                    faculty_id: parseInt(faculty_id, 10)
                })
            });

            showToast(res.message || 'Course added successfully!', 'success');
            form.reset();
        } catch (error) {
            showToast(error.message || 'Failed to create course.', 'error');
        } finally {
            setButtonLoading(submitBtn, false, 'Create Course');
        }
    });
}

