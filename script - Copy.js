const API_URL = "https://q-bank-backend.onrender.com";

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function logout() {
    localStorage.removeItem('userId');
    showPage('loginPage');
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('userId', data.user_id);
            showPage('dashboardPage');
            loadSubjects();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Signup
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${API_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Signup successful! Login now.');
            showPage('loginPage');
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Load subjects
async function loadSubjects() {
    const userId = localStorage.getItem('userId');
    try {
        const response = await fetch(`${API_URL}/api/subjects?user_id=${userId}`);
        const data = await response.json();
        let html = '';
        if (data.subjects?.length) {
            data.subjects.forEach(s => {
                html += `<div style="padding:10px; margin:10px 0; background:#f5f5f5; cursor:pointer;" onclick="selectSubject(${s.id})">${s.name}</div>`;
            });
        } else {
            html = '<p>No subjects. Create one!</p>';
        }
        document.getElementById('subjectsList').innerHTML = html;
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Add subject
document.getElementById('addSubjectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    const name = document.getElementById('subjectName').value;

    try {
        const response = await fetch(`${API_URL}/api/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, name })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Subject created!');
            showPage('dashboardPage');
            loadSubjects();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

function selectSubject(id) {
    localStorage.setItem('subjectId', id);
    showPage('subjectDetailPage');
}

// Upload
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subjectId = localStorage.getItem('subjectId');
    const formData = new FormData();
    
    const qbankFile = document.getElementById('qbankFile').files[0];
    if (qbankFile) formData.append('qbank', qbankFile);
    
    const notesFiles = document.getElementById('notesFile').files;
    for (let file of notesFiles) {
        formData.append('notes', file);
    }

    try {
        const response = await fetch(`${API_URL}/api/upload/${subjectId}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            alert(`Generated ${data.count} answers!`);
            showPage('subjectDetailPage');
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Check login on load
window.addEventListener('load', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        showPage('dashboardPage');
        loadSubjects();
    }
});
