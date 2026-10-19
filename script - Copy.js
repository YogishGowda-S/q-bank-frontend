// Change this to your Render backend URL
const API_URL = "https://q-bank-backend.onrender.com";  // For local testing
// For production: const API_URL = "https://your-render-app.onrender.com";

let currentUserId = null;
let currentSubjectId = null;

// Show/Hide Pages
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

function showLogin() {
    showPage('loginPage');
}

function showSignup() {
    showPage('signupPage');
}

function showDashboard() {
    showPage('dashboardPage');
    loadSubjects();
}

function showAddSubject() {
    showPage('addSubjectPage');
}

function showUpload() {
    currentSubjectId = localStorage.getItem('currentSubjectId');
    showPage('uploadPage');
}

function backToDashboard() {
    showDashboard();
}

function backToSubject() {
    showSubjectDetail();
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
            currentUserId = data.user_id;
            localStorage.setItem('userId', currentUserId);
            showDashboard();
        } else {
            alert(data.error || 'Login failed');
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
            alert('Signup successful! Please login.');
            showLogin();
        } else {
            alert(data.error || 'Signup failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Logout
function logout() {
    localStorage.removeItem('userId');
    currentUserId = null;
    showLogin();
}

// Load Subjects
async function loadSubjects() {
    currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
        showLogin();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/subjects?user_id=${currentUserId}`);
        const data = await response.json();

        let html = '<div class="subjects-grid">';
        
        if (data.subjects && data.subjects.length > 0) {
            data.subjects.forEach(subject => {
                html += `
                    <div class="subject-card" onclick="selectSubject(${subject.id})">
                        <h3>${subject.name}</h3>
                        <p>Click to view</p>
                    </div>
                `;
            });
        } else {
            html += '<p>No subjects yet. Create one!</p>';
        }
        
        html += '</div>';
        document.getElementById('subjectsList').innerHTML = html;
    } catch (error) {
        alert('Error loading subjects: ' + error.message);
    }
}

// Add Subject
document.getElementById('addSubjectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('subjectName').value;
    currentUserId = localStorage.getItem('userId');

    try {
        const response = await fetch(`${API_URL}/api/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, name })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Subject created!');
            showDashboard();
        } else {
            alert(data.error || 'Failed to create subject');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Select Subject
function selectSubject(subjectId) {
    localStorage.setItem('currentSubjectId', subjectId);
    showSubjectDetail();
}

// Show Subject Detail
async function showSubjectDetail() {
    const subjectId = localStorage.getItem('currentSubjectId');
    
    try {
        const response = await fetch(`${API_URL}/api/subjects/${subjectId}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('subjectTitle').innerText = data.subject.name;
            
            let html = '';
            if (data.qa_pairs && data.qa_pairs.length > 0) {
                data.qa_pairs.forEach((item, index) => {
                    html += `
                        <div class="qa-item">
                            <h3>Q${index + 1}: ${item.question_text.substring(0, 100)}...</h3>
                            <span class="marks">${item.marks || 10} Marks</span>
                            <div class="answer">${item.answer_text || 'No answer yet'}</div>
                        </div>
                    `;
                });
            } else {
                html = '<p>No Q&A yet. Upload files to generate answers.</p>';
            }
            
            document.getElementById('qaList').innerHTML = html;
            showPage('subjectDetailPage');
        } else {
            alert(data.error || 'Failed to load subject');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Upload Files
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subjectId = localStorage.getItem('currentSubjectId');
    const qbankFiles = document.getElementById('qbankFile').files;
    const notesFiles = document.getElementById('notesFile').files;

    if (qbankFiles.length === 0) {
        alert('Please select a question bank file');
        return;
    }

    const formData = new FormData();
    
    for (let file of qbankFiles) {
        formData.append('qbank', file);
    }
    
    for (let file of notesFiles) {
        formData.append('notes', file);
    }

    try {
        document.getElementById('uploadProgress').classList.remove('hidden');
        document.getElementById('progressText').innerText = 'Starting...';
        document.getElementById('uploadBtn').disabled = true;

        const response = await fetch(`${API_URL}/api/upload/${subjectId}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadBtn').disabled = false;

        if (response.ok) {
            alert(`Generated ${data.count} answers!`);
            showSubjectDetail();
        } else {
            alert(data.error || 'Upload failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadBtn').disabled = false;
    }
});

// Download PDF
async function downloadPDF() {
    const subjectId = localStorage.getItem('currentSubjectId');

    try {
        const response = await fetch(`${API_URL}/api/download/${subjectId}`);
        const data = await response.json();

        if (response.ok) {
            // Create PDF in browser
            alert('PDF download feature coming soon');
            // For now, just show data
            console.log(data);
        } else {
            alert(data.error || 'Download failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Check if user is logged in on page load
window.addEventListener('load', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        currentUserId = userId;
        showDashboard();
    } else {
        showLogin();
    }
});
