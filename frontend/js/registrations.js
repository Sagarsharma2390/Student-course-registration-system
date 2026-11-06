/**
 * STUDENT COURSE REGISTRATION SYSTEM (SCRS)
 * Registrations Management - Student "My Courses" & Admin Reports
 */

let allAdminRegistrations = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Student "My Courses" Page
    const myCoursesPage = document.getElementById('student-my-courses-page');
    if (myCoursesPage) {
        initStudentMyCourses();
    }

    // 2. Admin All Registrations Page
    const adminRegsPage = document.getElementById('admin-registrations-page');
    if (adminRegsPage) {
        initAdminRegistrationsPage();
    }
});

/**
 * Initialize Student's "My Courses" View
 */
async function initStudentMyCourses() {
    const student = requireStudentAuth();
    if (!student) return;

    try {
        const res = await apiRequest(`/registrations/student/${student.student_id}`);
        const list = res.data || [];

        renderStudentEnrollments(list);
    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        showToast('Failed to load registered courses.', 'error');
    }
}

/**
 * Render Student Enrollments Table & Summary
 */
function renderStudentEnrollments(list) {
    const tbody = document.getElementById('my-courses-tbody');
    const totalCreditsEl = document.getElementById('my-total-credits');
    const totalCoursesEl = document.getElementById('my-total-courses');

    if (totalCoursesEl) totalCoursesEl.textContent = list.length;

    // Calculate active credits
    const activeCredits = list
        .filter(r => r.status === 'Active')
        .reduce((sum, r) => sum + (parseInt(r.credits, 10) || 0), 0);

    if (totalCreditsEl) totalCreditsEl.textContent = activeCredits;

    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 3rem 1.5rem; color: #94a3b8;">
                    <div style="font-size:2.5rem;margin-bottom:0.5rem;">📚</div>
                    <h4 style="color:#0f172a;margin-bottom:0.25rem;">No Courses Registered Yet</h4>
                    <p style="margin-bottom:1rem;">Explore the course catalog to start registering for academic terms.</p>
                    <a href="/student/courses.html" class="btn btn-primary btn-sm">Browse Available Courses</a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = list.map(reg => `
        <tr>
            <td>
                <strong>${reg.course_name}</strong>
                <div style="font-size:0.75rem;color:#64748b;">${reg.department} • Sem ${reg.semester}</div>
            </td>
            <td><span class="badge badge-credits">${reg.credits} Credits</span></td>
            <td>${reg.faculty_name || 'Unassigned'}</td>
            <td>${formatDate(reg.registration_date)}</td>
            <td>
                <span class="badge ${reg.status === 'Active' ? 'badge-active' : 'badge-cancelled'}">
                    ${reg.status}
                </span>
            </td>
            <td>
                ${reg.status === 'Active' ? `
                    <button class="btn btn-danger btn-sm" onclick="cancelRegistrationAction(${reg.registration_id})">
                        Cancel Course
                    </button>
                ` : `
                    <span style="font-size:0.8rem;color:#94a3b8;font-style:italic;">Cancelled</span>
                `}
            </td>
        </tr>
    `).join('');
}

/**
 * Handle Course Cancellation
 */
async function cancelRegistrationAction(registrationId) {
    if (!confirm('Are you sure you want to cancel this course enrollment? This will be marked in your academic records.')) {
        return;
    }

    try {
        const res = await apiRequest(`/registrations/${registrationId}/cancel`, {
            method: 'PUT'
        });

        showToast(res.message || 'Registration cancelled successfully', 'success');
        // Refresh listing
        initStudentMyCourses();
    } catch (error) {
        showToast(error.message || 'Unable to cancel registration.', 'error');
    }
}

/**
 * Initialize Admin Registrations Report Page
 */
async function initAdminRegistrationsPage() {
    requireAdminAuth();

    const searchStudent = document.getElementById('search-student');
    const searchCourse = document.getElementById('search-course');
    const filterStatus = document.getElementById('filter-status');

    if (searchStudent) searchStudent.addEventListener('input', filterAndRenderAdminRegistrations);
    if (searchCourse) searchCourse.addEventListener('input', filterAndRenderAdminRegistrations);
    if (filterStatus) filterStatus.addEventListener('change', filterAndRenderAdminRegistrations);

    try {
        const res = await apiRequest('/registrations');
        allAdminRegistrations = res.data || [];
        filterAndRenderAdminRegistrations();
    } catch (error) {
        console.error('Error fetching admin registrations:', error);
        showToast('Failed to load system registrations report.', 'error');
    }
}

/**
 * Multi-criteria Filter & Render for Admin Registrations
 */
function filterAndRenderAdminRegistrations() {
    const studentQuery = (document.getElementById('search-student')?.value || '').toLowerCase().trim();
    const courseQuery = (document.getElementById('search-course')?.value || '').toLowerCase().trim();
    const statusQuery = document.getElementById('filter-status')?.value || '';

    const filtered = allAdminRegistrations.filter(r => {
        const matchStudent = (r.student_name && r.student_name.toLowerCase().includes(studentQuery)) ||
                             (r.student_email && r.student_email.toLowerCase().includes(studentQuery));
        const matchCourse = r.course_name && r.course_name.toLowerCase().includes(courseQuery);
        const matchStatus = !statusQuery || r.status === statusQuery;

        return matchStudent && matchCourse && matchStatus;
    });

    const tbody = document.getElementById('admin-registrations-tbody');
    const counterBadge = document.getElementById('reg-results-count');

    if (counterBadge) {
        counterBadge.textContent = `${filtered.length} Record${filtered.length === 1 ? '' : 's'}`;
    }

    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding:2.5rem;color:#94a3b8;">
                    No registration records match your filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td><strong>#${r.registration_id}</strong></td>
            <td>
                <div><strong>${r.student_name}</strong></div>
                <div style="font-size:0.8rem;color:#64748b;">${r.student_email}</div>
            </td>
            <td><strong>${r.course_name}</strong></td>
            <td>${r.faculty_name || 'Unassigned'}</td>
            <td>${formatDate(r.registration_date)}</td>
            <td>
                <span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-cancelled'}">
                    ${r.status}
                </span>
            </td>
            <td>
                <select class="form-control" style="padding:0.25rem 0.5rem;font-size:0.8rem;width:auto;"
                    onchange="changeRegistrationStatus(${r.registration_id}, this.value)">
                    <option value="Active" ${r.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Cancelled" ${r.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
        </tr>
    `).join('');
}

/**
 * Admin change registration status dynamically
 */
async function changeRegistrationStatus(registrationId, newStatus) {
    try {
        const res = await apiRequest(`/registrations/${registrationId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showToast(res.message || 'Status updated successfully', 'success');
        
        // Update local cache
        const item = allAdminRegistrations.find(x => x.registration_id === registrationId);
        if (item) item.status = newStatus;
        filterAndRenderAdminRegistrations();
    } catch (error) {
        showToast(error.message || 'Failed to update status', 'error');
        initAdminRegistrationsPage(); // Revert
    }
}

