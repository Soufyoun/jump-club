// --- CONFIG ---
const SUPABASE_URL = 'https://zcxspkeaybrcaljgdapb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeHNwa2VheWJyY2FsamdkYXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjk4NzEsImV4cCI6MjA5MTc0NTg3MX0.JeBvtDg0Txl6a_1vHNft3WZBR47BXLtOSE81gGeIzi0';
const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
};

// --- SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// --- STATE ---
let currentMoniteur = null;
let inscriptions = [];
let attendanceData = {};

// --- AUTH ---
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('loginCode').value.trim();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/moniteurs?code=eq.${encodeURIComponent(code)}&select=*`, { headers });
        const data = await res.json();
        if (data.length === 0) {
            errorEl.textContent = 'Code incorrect. Réessayez.';
            return;
        }
        currentMoniteur = data[0];
        localStorage.setItem('moniteur', JSON.stringify(currentMoniteur));
        openApp();
    } catch (err) {
        errorEl.textContent = 'Erreur de connexion.';
    }
});

// Check saved session
const saved = localStorage.getItem('moniteur');
if (saved) {
    currentMoniteur = JSON.parse(saved);
    openApp();
}

function openApp() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appShell').classList.add('active');
    document.getElementById('menuUserName').textContent = currentMoniteur.name;
    document.getElementById('dashName').textContent = currentMoniteur.name.split(' ')[0];
    document.getElementById('dashDate').textContent = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('presenceDate').value = new Date().toISOString().split('T')[0];
    refreshData();
}

function logout() {
    localStorage.removeItem('moniteur');
    currentMoniteur = null;
    document.getElementById('appShell').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    toggleMenu();
}

// --- NAVIGATION ---
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.menu-links a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });
    toggleMenu();
}

function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('open');
    document.getElementById('menuOverlay').classList.toggle('open');
}

// --- DATA ---
async function refreshData() {
    if (!currentMoniteur) return;

    // Load inscriptions for moniteur's groups
    const groups = currentMoniteur.groups || [];
    if (groups.length === 0) {
        document.getElementById('listesContent').innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:40px 0;">Aucun groupe assigné.</p>';
        return;
    }

    // Build filter for all assigned groups
    const filters = groups.map(g => {
        if (g.type === 'swim_group') {
            return `and(activity.eq.${g.activity},swim_group.eq.${g.value})`;
        } else if (g.type === 'time_slot') {
            return `and(activity.eq.${g.activity},time_slot.eq.${g.value})`;
        }
        return `activity.eq.${g.activity}`;
    });

    const orFilter = filters.join(',');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/inscriptions?or=(${orFilter})&select=*&order=child_last_name.asc`, { headers });
        inscriptions = await res.json();
        if (!Array.isArray(inscriptions)) inscriptions = [];
    } catch (e) {
        inscriptions = [];
    }

    // Update stats
    document.getElementById('statGroupes').textContent = groups.length;
    document.getElementById('statEnfants').textContent = inscriptions.length;

    // Load attendance stats
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?moniteur_id=eq.${currentMoniteur.id}&select=status`, { headers });
        const att = await res.json();
        if (Array.isArray(att)) {
            document.getElementById('statPresences').textContent = att.filter(a => a.status === 'present').length;
            document.getElementById('statAbsences').textContent = att.filter(a => a.status === 'absent').length;
        }
    } catch (e) {}

    renderListes();
    populatePresenceGroups();
}

// --- LISTES ---
function renderListes() {
    const container = document.getElementById('listesContent');
    const groups = currentMoniteur.groups || [];

    if (inscriptions.length === 0) {
        container.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:40px 0;">Aucun enfant inscrit dans vos groupes.</p>';
        return;
    }

    let html = '';
    groups.forEach(g => {
        const children = inscriptions.filter(i => {
            if (g.type === 'swim_group') return i.activity === g.activity && i.swim_group === g.value;
            if (g.type === 'time_slot') return i.activity === g.activity && i.time_slot === g.value;
            return i.activity === g.activity;
        });

        if (children.length === 0) return;

        const badgeClass = 'badge-' + (g.value || '').toLowerCase().replace(/[^a-z]/g, '');

        html += `
        <div class="group-card">
            <div class="group-card-header">
                <span class="group-badge ${badgeClass}">${g.label || g.value}</span>
                <span class="group-info">${g.location || ''}</span>
                <span class="group-count">${children.length} inscrits</span>
            </div>
            <table class="children-table">
                <thead>
                    <tr><th>#</th><th>Prénom</th><th>Nom</th><th>Âge</th></tr>
                </thead>
                <tbody>
                    ${children.map((c, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td class="child-name">${c.child_name || ''}</td>
                            <td>${c.child_last_name || ''}</td>
                            <td>${c.child_age || ''} ans</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    });

    container.innerHTML = html || '<p style="color:var(--gray-400);text-align:center;">Aucun enfant.</p>';
}

// --- PRESENCES ---
function populatePresenceGroups() {
    const select = document.getElementById('presenceGroupSelect');
    const groups = currentMoniteur.groups || [];
    select.innerHTML = '<option value="">Choisir un groupe</option>';
    groups.forEach((g, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${g.label || g.value} — ${g.location || ''}`;
        select.appendChild(opt);
    });
}

async function loadPresenceList() {
    const groupIdx = document.getElementById('presenceGroupSelect').value;
    const date = document.getElementById('presenceDate').value;
    const container = document.getElementById('presenceList');

    if (groupIdx === '' || !date) {
        container.innerHTML = '';
        return;
    }

    const g = currentMoniteur.groups[groupIdx];
    const children = inscriptions.filter(i => {
        if (g.type === 'swim_group') return i.activity === g.activity && i.swim_group === g.value;
        if (g.type === 'time_slot') return i.activity === g.activity && i.time_slot === g.value;
        return i.activity === g.activity;
    });

    // Load existing attendance for this date
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?date=eq.${date}&moniteur_id=eq.${currentMoniteur.id}&select=*`, { headers });
        const existing = await res.json();
        if (Array.isArray(existing)) {
            existing.forEach(a => {
                attendanceData[`${a.inscription_id}_${date}`] = a.status;
            });
        }
    } catch (e) {}

    let html = '';
    children.forEach(c => {
        const key = `${c.id}_${date}`;
        const status = attendanceData[key] || '';
        html += `
        <div class="presence-card">
            <div>
                <div class="presence-name">${c.child_name || ''} ${c.child_last_name || ''}</div>
                <div class="presence-age">${c.child_age || ''} ans</div>
            </div>
            <div class="presence-btns">
                <button class="presence-btn ${status === 'present' ? 'present' : ''}" onclick="markAttendance(${c.id}, '${date}', 'present', this)">✓</button>
                <button class="presence-btn ${status === 'absent' ? 'absent' : ''}" onclick="markAttendance(${c.id}, '${date}', 'absent', this)">✗</button>
            </div>
        </div>`;
    });

    html += '<div class="save-msg" id="saveMsg">Présence enregistrée !</div>';
    container.innerHTML = html;
}

window.markAttendance = async function(inscriptionId, date, status, btn) {
    const key = `${inscriptionId}_${date}`;
    attendanceData[key] = status;

    // Update UI
    const card = btn.closest('.presence-card');
    card.querySelectorAll('.presence-btn').forEach(b => b.classList.remove('present', 'absent'));
    btn.classList.add(status);

    // Save to Supabase
    try {
        // Check if record exists
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance?inscription_id=eq.${inscriptionId}&date=eq.${date}&moniteur_id=eq.${currentMoniteur.id}&select=id`, { headers });
        const existing = await checkRes.json();

        if (Array.isArray(existing) && existing.length > 0) {
            await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${existing[0].id}`, {
                method: 'PATCH',
                headers: { ...headers, 'Prefer': 'return=minimal' },
                body: JSON.stringify({ status })
            });
        } else {
            await fetch(`${SUPABASE_URL}/rest/v1/attendance`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                    inscription_id: inscriptionId,
                    moniteur_id: currentMoniteur.id,
                    date,
                    status
                })
            });
        }

        const msg = document.getElementById('saveMsg');
        if (msg) {
            msg.classList.add('visible');
            setTimeout(() => msg.classList.remove('visible'), 2000);
        }
    } catch (e) {
        console.error('Attendance error:', e);
    }
};
