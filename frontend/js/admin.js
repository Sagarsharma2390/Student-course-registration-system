/**
 * STUDENT COURSE REGISTRATION SYSTEM (SCRS)
 * Admin Workflow Handler: Login, Metrics & Reporting
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Admin Login Form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    // 2. Admin Dashboard View
    const dashboardView = document.getElementById('admin-dashboard-page');
    if (dashboardView) {
        initAdminDashboard();
    }
});

/**
 * Handle Admin Authentication
 */
async function handleAdminLogin(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('login-btn');
    const alertBox = document.getElementById('auth-alert');
    if (alertBox) alertBox.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showAuthAlert('Please provide both administrative email and password.', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const result = await apiRequest('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success && result.admin) {
            setAdminSession(result.admin);
            showToast('Welcome, Administrator ' + result.admin.name, 'success');
            setTimeout(() => {
                window.location.href = '/admin/dashboard.html';
            }, 600);
        }
    } catch (error) {
        showAuthAlert(error.message || 'Invalid admin credentials.', 'error');
    } finally {
        setButtonLoading(submitBtn, false, 'Authenticate Session');
    }
}

/**
 * Initialize Admin Dashboard Metrics & Activity Table
 */
async function initAdminDashboard() {
    const admin = requireAdminAuth();
    if (!admin) return;

    try {
        const res = await apiRequest('/admin/stats');
        const stats = res.stats || {};
        const recent = res.recentRegistrations || [];

        // Set Metric Counters
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val !== undefined ? val : 0;
        };

        setVal('stat-total-students', stats.totalStudents);
        setVal('stat-total-faculty', stats.totalFaculty);
        setVal('stat-total-courses', stats.totalCourses);
        setVal('stat-total-registrations', stats.totalRegistrations);
        setVal('stat-active-registrations', stats.activeRegistrations);
        setVal('stat-cancelled-registrations', stats.cancelledRegistrations);

        // Calculate and display CSS Status Distribution Meter
        renderStatusDistribution(stats.activeRegistrations || 0, stats.cancelledRegistrations || 0);

        // Render Recent Activity Table
        renderRecentActivityTable(recent);

    } catch (error) {
        console.error('Error loading admin dashboard stats:', error);
        showToast('Failed to load administrative analytics.', 'error');
    }
}

/**
 * Render Status Distribution Bar (Pure CSS)
 */
function renderStatusDistribution(active, cancelled) {
    const total = active + cancelled;
    const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
    const cancelledPercent = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    const barActive = document.getElementById('dist-bar-active');
    const barCancelled = document.getElementById('dist-bar-cancelled');

    if (barActive) barActive.style.width = `${activePercent}%`;
    if (barCancelled) barCancelled.style.width = `${cancelledPercent}%`;

    const txtActive = document.getElementById('dist-text-active');
    const txtCancelled = document.getElementById('dist-text-cancelled');

    if (txtActive) txtActive.textContent = `Active (${active} - ${activePercent}%)`;
    if (txtCancelled) txtCancelled.textContent = `Cancelled (${cancelled} - ${cancelledPercent}%)`;
}

/**
 * Render Recent Registrations Table
 */
function renderRecentActivityTable(recentList) {
    const tbody = document.getElementById('recent-registrations-tbody');
    if (!tbody) return;

    if (recentList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding:2rem;color:#94a3b8;">
                    No recent registration activities recorded.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = recentList.map(r => `
        <tr>
            <td><strong>#${r.registration_id}</strong></td>
            <td>${r.student_name}</td>
            <td><strong>${r.course_name}</strong></td>
            <td>${r.faculty_name || 'Unassigned'}</td>
            <td>${formatDate(r.registration_date)}</td>
            <td>
                <span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-cancelled'}">
                    ${r.status}
                </span>
            </td>
        </tr>
    `).join('');
}

/**
 * UI Alert Helper for Admin Auth
 */
function showAuthAlert(msg, type = 'error') {
    const alertBox = document.getElementById('auth-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `auth-alert auth-alert-${type}`;
    alertBox.style.display = 'block';
}

