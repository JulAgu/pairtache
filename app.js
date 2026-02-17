// API Configuration
const API_URL = window.location.origin + '/api';
console.log('🔧 API URL:', API_URL);

// Data Storage
let currentUser = null;
let currentUserType = null;
let workers = [];
let chiefs = [];
let availabilityPeriods = [];
let proposedTasks = [];
let taskAssignments = [];

// API Helper Functions
async function apiRequest(endpoint, method = 'GET', data = null) {
    const fullUrl = `${API_URL}${endpoint}`;
    console.log(`📡 API Request: ${method} ${fullUrl}`);
    
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
            console.log('📤 Request data:', data);
        }

        const response = await fetch(fullUrl, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📥 Response:', result);
        return result;
    } catch (error) {Admin
        console.error('❌ API request failed:', error);
        console.error('URL:', fullUrl);
        updateConnectionStatus(false);
        throw error;
    }
}

// Connection Status
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    
    if (connected) {
        statusEl.className = 'connection-status connected';
        statusText.textContent = '🟢 Connecté';
    } else {
        statusEl.className = 'connection-status disconnected';
        statusText.textContent = '🔴 Déconnecté';
    }
}

async function checkServerConnection() {
    try {
        await fetch(`${API_URL}/health`);
        updateConnectionStatus(true);
        return true;
    } catch (error) {
        updateConnectionStatus(false);
        return false;
    }
}

// Data Loading Functions
async function loadAllData() {
    try {
        const [workersData, chiefsData, periodsData, tasksData, assignmentsData] = await Promise.all([
            apiRequest('/workers'),
            apiRequest('/chiefs'),
            apiRequest('/availability'),
            apiRequest('/tasks'),
            apiRequest('/assignments')
        ]);

        workers = workersData;
        chiefs = chiefsData;
        availabilityPeriods = periodsData;
        proposedTasks = tasksData;
        taskAssignments = assignmentsData;

        console.log('✅ Data loaded:', { 
            workers: workers.length, 
            chiefs: chiefs.length, 
            periods: availabilityPeriods.length,
            tasks: proposedTasks.length,
            assignments: taskAssignments.length
        });
    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to connect to server. Please make sure the backend is running.');
    }
}

// Utility Functions

function formatDateEU(date) {
    const d = new Date(date); // ensure it's a Date object
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-based
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDate(date) {
    return formatDateEU(date.toISOString());
}

function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Login Functions
function showLoginType(type) {
    document.querySelectorAll('#loginScreen .tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('adminLogin').style.display = type === 'admin' ? 'block' : 'none';
    document.getElementById('chiefLogin').style.display = type === 'chief' ? 'block' : 'none';
}

function loginAdmin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (username === 'admin' && password === 'admin123') {
        currentUser = { username };
        currentUserType = 'admin';
        showMainApp();
    } else {
        alert('Invalid credentials!');
    }
}

async function loginChief() {
    const name = document.getElementById('chiefName').value.trim();
    if (name) {
        await loadAllData();
        const chief = chiefs.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (chief) {
            currentUser = chief;
            currentUserType = 'chief';
            showMainApp();
        } else {
            alert('Chief not found! Please contact admin.');
        }
    } else {
        alert('Please enter your name');
    }
}

function logout() {
    currentUser = null;
    currentUserType = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('chiefName').value = '';
}

async function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Check server connection
    await checkServerConnection();

    // Load all data
    await loadAllData();

    if (currentUserType === 'admin') {
        document.getElementById('userBadge').textContent = `Admin: ${currentUser.username}`;
        document.getElementById('adminTabs').style.display = 'block';
        document.getElementById('chiefTabs').style.display = 'none';
        document.getElementById('addWorkerBtn').style.display = 'block';
        switchTab('workers');
    } else {
        document.getElementById('userBadge').textContent = `Responsable: ${currentUser.name}`;
        document.getElementById('adminTabs').style.display = 'none';
        document.getElementById('chiefTabs').style.display = 'block';
        document.getElementById('addWorkerBtn').style.display = 'none';
        switchTab('proposedTasks');
    }

    updateFilterOptions();
    renderWorkers();
}

// Tab Switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab - find the tab button by its onclick attribute
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(tab => {
        if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(`'${tabName}'`)) {
            tab.classList.add('active');
        }
    });
    
    switch(tabName) {
        case 'workers':
            document.getElementById('workersTab').style.display = 'block';
            renderWorkers();
            break;
        case 'schedule':
            document.getElementById('scheduleTab').style.display = 'block';
            renderScheduleOverview();
            break;
        case 'chiefs':
            document.getElementById('chiefsTab').style.display = 'block';
            renderChiefs();
            break;
        case 'proposedTasks':
            document.getElementById('proposedTasksTab').style.display = 'block';
            renderProposedTasks();
            break;
        case 'matching':
            document.getElementById('matchingTab').style.display = 'block';
            renderMatchingView();
            break;
    }
}

// Worker Management
function openAddWorkerModal() {
    document.getElementById('addWorkerModal').classList.add('active');
}

async function addWorker() {
    const name = document.getElementById('workerName').value.trim();
    const department = document.getElementById('workerDepartment').value.trim();
    const skillsInput = document.getElementById('workerSkills').value.trim();
    const phoneNumber = document.getElementById('workerTelephone').value.trim();
    const email = document.getElementById('workerEmail').value.trim();

    if (!name || !department) {
        alert('Veuillez remplir tous les champs requis (*)');
        return;
    }

    const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()) : [];

    try {
        await apiRequest('/workers', 'POST', { name, department, skills, phoneNumber, email });
        await loadAllData();
        closeModal('addWorkerModal');
        renderWorkers();
        updateFilterOptions();

        // Clear form
        document.getElementById('workerName').value = '';
        document.getElementById('workerDepartment').value = '';
        document.getElementById('workerSkills').value = '';
        document.getElementById('workerTelephone').value = '';
        document.getElementById('workerEmail').value = '';
    } catch (error) {
        alert('Failed to add worker');
    }
}

async function deleteWorker(workerId) {
    if (confirm('Etes vous sûr de vouloir supprimer cet alternant ?')) {
        try {
            await apiRequest(`/workers/${workerId}`, 'DELETE');
            await loadAllData();
            renderWorkers();
        } catch (error) {
            alert('Failed to delete worker');
        }
    }
}

// Availability Management (Day-based)
function openAddAvailabilityModal(workerId) {
    document.getElementById('availabilityWorkerId').value = workerId;
    const today = new Date();
    document.getElementById('availabilityStartDate').value = formatDate(today);
    document.getElementById('availabilityEndDate').value = formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
    document.getElementById('addAvailabilityModal').classList.add('active');
}

async function addAvailability() {
    const workerId = parseInt(document.getElementById('availabilityWorkerId').value);
    const startDate = document.getElementById('availabilityStartDate').value;
    const endDate = document.getElementById('availabilityEndDate').value;

    if (!startDate || !endDate) {
        alert('Veuillez saisir un début et une fin de période');
        return;
    }

    if (new Date(endDate) < new Date(startDate)) {
        alert('End date must be after start date');
        return;
    }

    try {
        await apiRequest('/availability', 'POST', { workerId, startDate, endDate });
        await loadAllData();
        closeModal('addAvailabilityModal');
        renderWorkers();

        // Clear form
        document.getElementById('availabilityStartDate').value = '';
        document.getElementById('availabilityEndDate').value = '';
    } catch (error) {
        alert('Failed to add availability period');
    }
}

async function deleteAvailabilityPeriod(periodId) {
    if (confirm('Etes vous sûr de vouloir supprimer cette période de disponibilité ?')) {
        try {
            await apiRequest(`/availability/${periodId}`, 'DELETE');
            await loadAllData();
            renderWorkers();
        } catch (error) {
            alert('Failed to delete availability period');
        }
    }
}

// Task Proposal (Chiefs)
function openProposeTaskModal() {
    const today = new Date();
    document.getElementById('taskStartDate').value = formatDate(today);
    document.getElementById('taskEndDate').value = formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000));
    document.getElementById('proposeTaskModal').classList.add('active');
}

async function proposeTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const skillsInput = document.getElementById('taskRequiredSkills').value.trim();
    const department = document.getElementById('taskRequiredDepartment').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const startDate = document.getElementById('taskStartDate').value;
    const endDate = document.getElementById('taskEndDate').value;

    if (!title || !startDate || !endDate) {
        alert('Veuillez remplir tous les champs requis (*)');
        return;
    }

    const required_skills = skillsInput ? skillsInput.split(',').map(s => s.trim()) : [];
    const estimated_days = calculateDaysBetween(startDate, endDate) + 1;

    try {
        await apiRequest('/tasks', 'POST', {
            chief_id: currentUser.id,
            chief_name: currentUser.name,
            title,
            description,
            required_skills,
            required_department: department,
            priority,
            estimated_days,
            start_date: startDate,
            end_date: endDate
        });

        await loadAllData();
        closeModal('proposeTaskModal');
        renderProposedTasks();

        // Clear form
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskRequiredSkills').value = '';
        document.getElementById('taskRequiredDepartment').value = '';
        document.getElementById('taskStartDate').value = '';
        document.getElementById('taskEndDate').value = '';
    } catch (error) {
        alert('Failed to propose task');
    }
}

async function deleteTask(taskId) {
    if (confirm('Etes vous sûr de vouloir supprimer cette tâche ?')) {
        try {
            await apiRequest(`/tasks/${taskId}`, 'DELETE');
            await loadAllData();
            renderProposedTasks();
        } catch (error) {
            alert('Failed to delete task');
        }
    }
}

// Matching Algorithm
let matchingResults = null;

async function runMatchingAlgorithm() {
    try {
        const result = await apiRequest('/match-tasks', 'POST');

        // Normalize matches
        matchingResults = Array.isArray(result.matches) ? result.matches : [];

        matchingResults.forEach(match => {
            // Ensure task.required_skills is always an array
            match.task.required_skills = Array.isArray(match.task.required_skills)
                ? match.task.required_skills
                : [];

            // Ensure candidates' worker_skills is always an array
            if (Array.isArray(match.candidates)) {
                match.candidates.forEach(candidate => {
                    candidate.worker_skills = Array.isArray(candidate.worker_skills)
                        ? candidate.worker_skills
                        : candidate.worker_skills
                        ? candidate.worker_skills.split(',').map(s => s.trim())
                        : [];
                });
            } else {
                match.candidates = [];
            }
        });

        renderMatchingView();
        
    } catch (error) {
        console.error(error);
        alert('Failed to run matching algorithm');
    }
}

async function confirmMatch(taskId, workerId, startDate, endDate, matchScore) {
    if (!confirm('Confirm this assignment?')) {
        return;
    }
    
    try {
        await apiRequest('/assignments/confirm', 'POST', {
            task_id: taskId,
            worker_id: workerId,
            start_date: startDate,
            end_date: endDate,
            match_score: matchScore
        });
        
        await loadAllData();
        await runMatchingAlgorithm();
        renderMatchingView();
        
    } catch (error) {
        alert('Failed to confirm assignment');
    }
}

async function cancelAssignment(assignmentId) {
    if (!confirm('Cancel this assignment? The task will return to pending status.')) {
        return;
    }
    
    try {
        await apiRequest(`/assignments/${assignmentId}`, 'DELETE');
        await loadAllData();
        alert('✅ Assignment cancelled!');
        renderMatchingView();
    } catch (error) {
        alert('Failed to cancel assignment');
    }
}

// Chief Management
function openAddChiefModal() {
    document.getElementById('addChiefModal').classList.add('active');
}

async function addChief() {
    const name = document.getElementById('chiefNameInput').value.trim();
    const department = document.getElementById('chiefDepartment').value.trim();
    const email = document.getElementById('chiefEmail').value.trim();

    if (!name) {
        alert('Veuillez saisir au moins le Nom Prénom du responsable');
        return;
    }

    try {
        await apiRequest('/chiefs', 'POST', { name, department, email });
        await loadAllData();
        closeModal('addChiefModal');
        renderChiefs();

        // Clear form
        document.getElementById('chiefNameInput').value = '';
        document.getElementById('chiefDepartment').value = '';
        document.getElementById('chiefEmail').value = '';
    } catch (error) {
        alert('Failed to add chief');
    }
}

async function deleteChief(chiefId) {
    if (confirm('Etes vous sûr de vouloir supprimer ce responsable ?')) {
        try {
            await apiRequest(`/chiefs/${chiefId}`, 'DELETE');
            await loadAllData();
            renderChiefs();
        } catch (error) {
            alert('Failed to delete chief');
        }
    }
}

// Filtering
function updateFilterOptions() {
    const skills = new Set();
    const departments = new Set();

    workers.forEach(worker => {
        if (worker.skills && Array.isArray(worker.skills)) {
            worker.skills.forEach(skill => skills.add(skill));
        }
        if (worker.department) {
            departments.add(worker.department);
        }
    });

    console.log('🔍 Filter options updated:', { 
        skills: Array.from(skills), 
        departments: Array.from(departments),
        totalWorkers: workers.length 
    });

    const skillFilter = document.getElementById('skillFilter');
    const departmentFilter = document.getElementById('departmentFilter');

    if (skillFilter) {
        skillFilter.innerHTML = '<option value="">Toutes les Compétences</option>';
        skills.forEach(skill => {
            skillFilter.innerHTML += `<option value="${skill}">${skill}</option>`;
        });
    }

    if (departmentFilter) {
        departmentFilter.innerHTML = '<option value="">Tous les Rattachements</option>';
        departments.forEach(dept => {
            departmentFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
        });
    }
}

function filterWorkers() {
    const searchTerm = document.getElementById('searchWorkers').value.toLowerCase();
    const skillFilter = document.getElementById('skillFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    const availabilityFilter = document.getElementById('availabilityFilter').value;

    console.log('🔍 Filtering with:', { searchTerm, skillFilter, departmentFilter, availabilityFilter });

    const filtered = workers.filter(worker => {
        const matchesSearch = worker.name.toLowerCase().includes(searchTerm);
        const matchesSkill = !skillFilter || (worker.skills && worker.skills.includes(skillFilter));
        const matchesDepartment = !departmentFilter || worker.department === departmentFilter;
        
        let matchesAvailability = true;
        if (availabilityFilter === 'available') {
            const workerPeriods = availabilityPeriods.filter(p => p.worker_id === worker.id);
            matchesAvailability = workerPeriods.length > 0;
        }

        return matchesSearch && matchesSkill && matchesDepartment && matchesAvailability;
    });

    console.log(`🔍 Filtered: ${filtered.length} of ${workers.length} workers`);
    renderWorkers(filtered);
}

// Rendering Functions
function renderWorkers(workersToRender = workers) {
    const grid = document.getElementById('workersGrid');
    
    if (workersToRender.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3>Aucun alternant</h3>
                <p>Ajouter un alternant pour commencer</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = workersToRender.map(worker => {
        const workerPeriods = availabilityPeriods.filter(p => p.worker_id === worker.id);
        const workerAssignments = taskAssignments.filter(a => a.worker_id === worker.id);

        return `
            <div class="worker-card">
                <div class="worker-header">
                    <div>
                        <div class="worker-name">${worker.name}</div>
                        <div style="font-size: 13px; font-style: italic; color: #6b7280; margin-top: 4px;">${worker.department}</div>
                        <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${worker.phone_number}</div>
                    </div>
                    ${currentUserType === 'admin' ? `
                        <button class="btn btn-danger btn-small" onclick="deleteWorker(${worker.id})">Supprimer</button>
                    ` : ''}
                </div>
                
                ${worker.skills.length > 0 ? `
                    <div class="worker-skills">
                        ${worker.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="availability-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="availability-title">
                            Période(s) de présence(s) (${workerPeriods.length})
                        </div>
                        ${currentUserType === 'admin' ? `
                            <button class="btn btn-secondary btn-small" onclick="openAddAvailabilityModal(${worker.id})">+ Ajout période</button>
                        ` : ''}
                    </div>
                    
                    ${workerPeriods.length === 0 ? `
                        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 13px;">
                            Aucune période de disponibilité
                        </div>
                    ` : `
                        <div class="time-slots">
                            ${workerPeriods.map(period => {
                                return `
                                <div class="time-slot">
                                    <div>
                                        <div class="time-info">
                                            📅 ${formatDateEU(period.start_date)} to ${formatDateEU(period.end_date)}
                                        </div>
                                    </div>
                                    <div class="time-actions">
                                        ${currentUserType === 'admin' ? `
                                            <button class="btn btn-danger btn-small" onclick="deleteAvailabilityPeriod(${period.id})">Supprimer</button>
                                        ` : ''}
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    `}
                </div>

                ${workerAssignments.length > 0 ? `
                    <div class="availability-section" style="margin-top: 15px;">
                        <div class="availability-title">Tâche(s) assignée(s) (${workerAssignments.length})</div>
                        <div class="time-slots">
                            ${workerAssignments.map(assignment => `
                                <div class="time-slot claimed">
                                    <div>
                                        <div class="time-info">📋 ${assignment.title}</div>
                                        <div class="task-info">
                                            ${assignment.start_date} to ${assignment.end_date} | 
                                            Match: ${assignment.match_score ? assignment.match_score.toFixed(1) : 'N/A'}%
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderScheduleOverview() {
    const table = document.getElementById('scheduleTable');
    
    if (taskAssignments.length === 0) {
        table.innerHTML = `
            <tr><td colspan="7" style="text-align: center; padding: 40px;">
                Aucune assignation actuellement. Proposer des tâches et lancez le système de correspondance.
            </td></tr>
        `;
        return;
    }

    const sortedAssignments = [...taskAssignments].sort((a, b) => 
        a.start_date.localeCompare(b.start_date)
    );

    table.innerHTML = `
        <thead>
            <tr>
                <th>Tâche</th>
                <th>Responsable</th>
                <th>Alternant</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>Numéro téléphone</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            ${sortedAssignments.map(assignment => {
                const worker = workers.find(w => w.id === assignment.worker_id);
                const chief = chiefs.find(c => c.id === assignment.chief_id);
                return `
                    <tr>
                        <td>${assignment.title}</td>
                        <td>${assignment.chief_name}</td>
                        <td>${assignment.worker_name}</td>
                        <td>${assignment.start_date}</td>
                        <td>${assignment.end_date}</td>
                        <td>${assignment.phone_number}</td>
                        <td>
                            <span class="status-badge status-claimed">
                                ${assignment.status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
}

function renderChiefs() {
    const grid = document.getElementById('chiefsGrid');
    
    if (chiefs.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👔</div>
                <h3>Aucun responsable trouvé</h3>
                <p>Ajouter des responsables pour la gestion des tâches</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = chiefs.map(chief => {
        const chiefTasks = proposedTasks.filter(t => t.chief_id === chief.id);
        
        return `
            <div class="worker-card">
                <div class="worker-header">
                    <div>
                        <div class="worker-name">${chief.name}</div>
                        <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${chief.department || 'No department'}</div>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="deleteChief(${chief.id})">Supprimer</button>
                </div>
                <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">
                        📧 ${chief.email || 'No email'}
                    </div>
                    <div style="font-size: 13px; color: #6b7280;">
                        📋 ${chiefTasks.length} tasks proposed
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderProposedTasks() {
    const container = document.getElementById('proposedTasksList');
    
    if (proposedTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>Aucune tâche proposée actuellement</h3>
                <p>Proposer des tâches à attribuer aux travailleurs</p>
            </div>
        `;
        return;
    }

    const myTasks = currentUserType === 'chief' 
        ? proposedTasks.filter(t => t.chief_id === currentUser.id)
        : proposedTasks;

    container.innerHTML = myTasks.map(task => {
        const worker = task.matched_worker_id ? workers.find(w => w.id === task.matched_worker_id) : null;
        const statusClass = task.status === 'pending' ? 'status-available' : 'status-claimed';
        
        return `
            <div class="worker-card" style="margin-bottom: 20px;">
                <div class="worker-header">
                    <div>
                        <div class="worker-name">${task.title}</div>
                        <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                            By: ${task.chief_name} | Priority: ${task.priority}
                        </div>
                    </div>
                    ${(currentUserType === 'admin' || (currentUserType === 'chief' && task.chief_id === currentUser.id)) ? `
                        <button class="btn btn-danger btn-small" onclick="deleteTask(${task.id})">Supprimer</button>
                    ` : ''}
                </div>
                
                <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 6px;">
                    <div style="font-size: 13px; color: #374151; margin-bottom: 8px;">
                        ${task.description || 'No description'}
                    </div>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; font-size: 12px; color: #6b7280;">
                        <div>📅 ${task.start_date} to ${task.end_date} (${task.estimated_days} days)</div>
                        ${task.required_department ? `<div>🏢 ${task.required_department}</div>` : ''}
                    </div>
                    ${task.required_skills && task.required_skills.length > 0 ? `
                        <div class="worker-skills" style="margin-top: 8px;">
                            ${task.required_skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>

                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span class="status-badge ${statusClass}">
                        ${task.status} ${worker ? `→ ${worker.name}` : ''}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function renderMatchingView() {
    const container = document.getElementById('matchingContent');
    
    const pendingTasks = proposedTasks.filter(t => t.status === 'pending');
    const assignedTasks = proposedTasks.filter(t => t.status === 'assigned');
    
    container.innerHTML = `
        <div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h3 style="color: #1f2937; margin-bottom: 5px;">Système d'analyse de correspondance</h3>
                    <p style="color: #6b7280; font-size: 14px;">
                        ${pendingTasks.length} tâches en attente | ${assignedTasks.length} mission assignée
                    </p>
                </div>
                <button class="btn btn-primary" onclick="runMatchingAlgorithm()">
                    🤖 Lancer l'analyse de correspondance
                </button>
            </div>

            ${matchingResults && matchingResults.length > 0 ? `
                <div style="margin-bottom: 40px;">
                    <h4 style="color: #1f2937; margin-bottom: 15px;">💡 Proposed Matches (Review & Confirm)</h4>
                    ${matchingResults.map(match => {
                        const task = match.task;
                        const candidates = match.candidates;
                        
                        return `
                            <div class="worker-card" style="margin-bottom: 25px; background: #fef3c7; border: 2px solid #fbbf24;">
                                <div style="margin-bottom: 15px;">
                                    <div class="worker-name" style="margin-bottom: 5px;">📋 ${task.title}</div>
                                    <div style="font-size: 13px; color: #6b7280;">
                                        ${task.description || 'No description'} | 
                                        ${task.start_date} to ${task.end_date} (${task.estimated_days} days) |
                                        Priority: ${task.priority}
                                    </div>
                                    ${task.required_skills && task.required_skills.length > 0 ? `
                                        <div class="worker-skills" style="margin-top: 8px;">
                                            ${task.required_skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>

                                <div style="background: white; padding: 15px; border-radius: 8px;">
                                    <div style="font-weight: 600; margin-bottom: 12px; color: #374151;">
                                        👥 Top Candidates:
                                    </div>
                                    ${candidates.length === 0 ? `
                                        <div style="text-align: center; padding: 20px; color: #ef4444;">
                                            ⚠️ No suitable workers found. Check availability and requirements.
                                        </div>
                                    ` : `
                                        <div style="display: flex; flex-direction: column; gap: 10px;">
                                            ${candidates.map((candidate, index) => `
                                                <div style="display: flex; justify-content: space-between; align-items: center; 
                                                            padding: 12px; background: #f9fafb; border-radius: 6px;
                                                            border: 2px solid ${index === 0 ? '#10b981' : '#e5e7eb'};">
                                                    <div style="flex: 1;">
                                                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                                                            ${index === 0 ? '⭐ ' : ''}${candidate.worker_name}
                                                            ${index === 0 ? '<span style="color: #10b981; font-size: 12px;"> (Best Match)</span>' : ''}
                                                        </div>
                                                        <div style="font-size: 12px; color: #6b7280;">
                                                            ${candidate.worker_department} | 
                                                            Skills: ${candidate.worker_skills || 'None'} |
                                                            ${candidate.has_availability ? '✅ Available' : '⚠️ Limited availability'}
                                                        </div>
                                                    </div>
                                                    <div style="display: flex; align-items: center; gap: 12px;">
                                                        <span class="status-badge ${candidate.score >= 70 ? 'status-available' : candidate.score >= 40 ? 'status-claimed' : 'status-available'}" 
                                                              style="font-size: 14px; font-weight: 600;">
                                                            ${candidate.score.toFixed(1)}%
                                                        </span>
                                                        <button class="btn btn-success btn-small" 
                                                                onclick="confirmMatch(${task.id}, ${candidate.worker_id}, '${task.start_date}', '${task.end_date}', ${candidate.score})">
                                                            ✓ Confirm
                                                        </button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}

            ${taskAssignments.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">🤖</div>
                    <h3>Aucune tâche assignée actuellement</h3>
                    <p>Utiliser le système de correspondance pour vous aider</p>
                </div>
            ` : `
                <div>
                    <h4 style="color: #1f2937; margin-bottom: 15px;">✅ Mission assignée</h4>
                    <div class="workers-grid">
                        ${taskAssignments.map(assignment => {
                            const task = proposedTasks.find(t => t.id === assignment.task_id);
                            const worker = workers.find(w => w.id === assignment.worker_id);
                            const days = calculateDaysBetween(assignment.start_date, assignment.end_date) + 1;
                            
                            return `
                                <div class="worker-card" style="background: #d1fae5; border: 2px solid #10b981;">
                                    <div class="worker-header">
                                        <div>
                                            <div class="worker-name">${task?.title || 'Unknown Task'}</div>
                                            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                                                👤 ${worker?.name || 'Unknown'} | ${worker?.department || 'N/A'}
                                            </div>
                                        </div>
                                        <span class="status-badge status-available" style="font-size: 14px;">
                                            ${assignment.match_score ? assignment.match_score.toFixed(1) + '%' : 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
                                        <div style="font-size: 13px; color: #374151; margin-bottom: 10px;">
                                            📅 ${assignment.start_date} to ${assignment.end_date} (${days} days)
                                        </div>
                                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
                                            Priority: ${task?.priority || 'N/A'} | 
                                            Status: ${assignment.status}
                                        </div>
                                        <button class="btn btn-danger btn-small" onclick="cancelAssignment(${assignment.id})">
                                            ✕ Cancel Assignment
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `}
        </div>
    `;
}

// Modal Management
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Initialize - check server on load
checkServerConnection();
