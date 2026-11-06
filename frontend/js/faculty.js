/**
 * STUDENT COURSE REGISTRATION SYSTEM (SCRS)
 * Faculty Management Operations
 */

document.addEventListener('DOMContentLoaded', () => {
    const addFacultyForm = document.getElementById('add-faculty-form');
    if (addFacultyForm) {
        initAddFacultyForm();
    }
});

/**
 * Initialize Faculty Creation Form
 */
function initAddFacultyForm() {
    requireAdminAuth();

    const form = document.getElementById('add-faculty-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-btn');

        const faculty_name = document.getElementById('faculty_name').value.trim();
        const email = document.getElementById('email').value.trim();
        const department = document.getElementById('department').value.trim();

        if (!faculty_name || !email || !department) {
            showToast('All fields (Name, Email, Department) are required.', 'warning');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid faculty email address.', 'warning');
            return;
        }

        setButtonLoading(submitBtn, true);

        try {
            const res = await apiRequest('/faculty', {
                method: 'POST',
                body: JSON.stringify({
                    faculty_name,
                    email,
                    department
                })
            });

            showToast(res.message || 'Faculty added successfully!', 'success');
            form.reset();
            loadFacultyListTable(); // Refresh table if present
        } catch (error) {
            showToast(error.message || 'Failed to add faculty member.', 'error');
        } finally {
            setButtonLoading(submitBtn, false, 'Add Faculty Member');
        }
    });

    // Optionally load list of existing faculty
    loadFacultyListTable();
}

/**
 * Load existing faculty list into table if container exists
 */
async function loadFacultyListTable() {
    const tbody = document.getElementById('faculty-table-tbody');
    if (!tbody) return;

    try {
        const res = await apiRequest('/faculty');
        const list = res.data || [];

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:1.5rem;color:#94a3b8;">No faculty members registered.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(f => `
            <tr>
                <td><strong>#${f.faculty_id}</strong></td>
                <td><strong>${f.faculty_name}</strong></td>
                <td>${f.email}</td>
                <td><span class="badge badge-dept">${f.department}</span></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading faculty list:', err);
    }
}

