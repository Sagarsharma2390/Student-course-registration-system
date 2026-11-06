/**
 * STUDENT COURSE REGISTRATION SYSTEM (SCRS)
 * Authentication & Session Management Module
 */

const AUTH_KEYS = {
    STUDENT: 'scrs_student_user',
    ADMIN: 'scrs_admin_user'
};

// ==========================================
// Student Auth Utilities
// ==========================================

function getLoggedInStudent() {
    const studentData = sessionStorage.getItem(AUTH_KEYS.STUDENT);
    if (!studentData) return null;
    try {
        return JSON.parse(studentData);
    } catch (e) {
        return null;
    }
}

function setStudentSession(student) {
    sessionStorage.setItem(AUTH_KEYS.STUDENT, JSON.stringify(student));
}

function requireStudentAuth() {
    const student = getLoggedInStudent();
    if (!student) {
        window.location.href = '/student/login.html';
        return null;
    }
    updateStudentHeader(student);
    return student;
}

function studentLogout() {
    sessionStorage.removeItem(AUTH_KEYS.STUDENT);
    window.location.href = '/student/login.html';
}

function updateStudentHeader(student) {
    document.addEventListener('DOMContentLoaded', () => {
        const nameElems = document.querySelectorAll('.student-display-name');
        nameElems.forEach(el => el.textContent = student.name);

        const emailElems = document.querySelectorAll('.student-display-email');
        emailElems.forEach(el => el.textContent = student.email);

        const deptElems = document.querySelectorAll('.student-display-dept');
        deptElems.forEach(el => el.textContent = `${student.department} (Sem ${student.semester})`);

        const avatarElems = document.querySelectorAll('.student-display-avatar');
        avatarElems.forEach(el => {
            el.textContent = student.name ? student.name.charAt(0).toUpperCase() : 'S';
        });

        const dateEl = document.querySelector('.current-date');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    });
}

// ==========================================
// Admin Auth Utilities
// ==========================================

function getLoggedInAdmin() {
    const adminData = sessionStorage.getItem(AUTH_KEYS.ADMIN);
    if (!adminData) return null;
    try {
        return JSON.parse(adminData);
    } catch (e) {
        return null;
    }
}

function setAdminSession(admin) {
    sessionStorage.setItem(AUTH_KEYS.ADMIN, JSON.stringify(admin));
}

function requireAdminAuth() {
    const admin = getLoggedInAdmin();
    if (!admin) {
        window.location.href = '/admin/login.html';
        return null;
    }
    updateAdminHeader(admin);
    return admin;
}

function adminLogout() {
    sessionStorage.removeItem(AUTH_KEYS.ADMIN);
    window.location.href = '/admin/login.html';
}

function updateAdminHeader(admin) {
    document.addEventListener('DOMContentLoaded', () => {
        const nameElems = document.querySelectorAll('.admin-display-name');
        nameElems.forEach(el => el.textContent = admin.name);

        const emailElems = document.querySelectorAll('.admin-display-email');
        emailElems.forEach(el => el.textContent = admin.email);

        const avatarElems = document.querySelectorAll('.admin-display-avatar');
        avatarElems.forEach(el => {
            el.textContent = admin.name ? admin.name.charAt(0).toUpperCase() : 'A';
        });

        const dateEl = document.querySelector('.current-date');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    });
}

