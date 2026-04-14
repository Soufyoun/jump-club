/* ============================================
   JUMP CLUB — Script Principal
   ============================================ */

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://zcxspkeaybrcaljgdapb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeHNwa2VheWJyY2FsamdkYXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjk4NzEsImV4cCI6MjA5MTc0NTg3MX0.JeBvtDg0Txl6a_1vHNft3WZBR47BXLtOSE81gGeIzi0';

const supabaseHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
};

// --- DATABASE ---
async function getInscriptions() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/inscriptions?order=created_at.desc`, {
            headers: supabaseHeaders
        });
        if (!res.ok) throw new Error('Fetch failed');
        return await res.json();
    } catch (e) {
        console.error('Supabase fetch error:', e);
        // Fallback localStorage
        return JSON.parse(localStorage.getItem('jump_club_inscriptions') || '[]');
    }
}

async function saveInscription(data) {
    const row = {
        child_name: data.childName,
        child_age: parseInt(data.childAge),
        activity: data.activity,
        period: data.period,
        group_name: assignGroup(data.activity, data.childAge),
        parent_name: data.parentName,
        parent_email: data.parentEmail,
        parent_phone: data.parentPhone,
        message: data.message || '',
        price: data.price || 0,
        payment_method: data.paymentMethod || 'non specifie',
        payment_status: 'pending'
    };

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/inscriptions`, {
            method: 'POST',
            headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify(row)
        });
        if (!res.ok) throw new Error('Insert failed');
        const result = await res.json();
        const saved = result[0];
        updateAdminPanel();
        return saved;
    } catch (e) {
        console.error('Supabase insert error:', e);
        // Fallback localStorage
        const local = JSON.parse(localStorage.getItem('jump_club_inscriptions') || '[]');
        row.id = Date.now();
        row.created_at = new Date().toISOString();
        local.push(row);
        localStorage.setItem('jump_club_inscriptions', JSON.stringify(local));
        updateAdminPanel();
        return row;
    }
}

function assignGroup(activity, age) {
    if (activity.startsWith('natation')) {
        const ageNum = parseInt(age);
        if (ageNum <= 5) return 'Natation - Debutants';
        if (ageNum <= 8) return 'Natation - Moyens';
        return 'Natation - Confirmes';
    }
    if (activity.includes('-start-')) return 'Stage - Jumpy Start (3-4 ans)';
    if (activity.includes('-boost-')) return 'Stage - Jumpy Boost (5-6 ans)';
    if (activity.includes('-go-')) return 'Stage - Jumpy Go (7-12 ans)';
    return 'Non assigne';
}

function getPrice(activity, period) {
    const prices = {
        'natation-ixelles': { 'saison-2025-2026': 210 },
        'natation-molenbeek': { 'saison-2025-2026': 210 },
        'stage-start-molenbeek': { carnaval: 70, paques: 70, ete: 70, toussaint: 70 },
        'stage-boost-molenbeek': { carnaval: 80, paques: 80, ete: 80, toussaint: 80 },
        'stage-go-molenbeek': { carnaval: 90, paques: 90, ete: 90, toussaint: 90 },
        'stage-start-uccle': { carnaval: 90, paques: 90, ete: 90, toussaint: 90 },
        'stage-boost-uccle': { carnaval: 100, paques: 100, ete: 100, toussaint: 100 },
        'stage-go-uccle': { carnaval: 110, paques: 110, ete: 110, toussaint: 110 },
    };
    return prices[activity]?.[period] || 0;
}

// --- NAVBAR ---
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const allNavLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    // Floating CTA
    const floatingCta = document.getElementById('floatingCta');
    if (floatingCta) {
        floatingCta.classList.toggle('visible', window.scrollY > 600);
    }
});

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    allNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// --- COUNTER ANIMATION ---
function animateCounters() {
    document.querySelectorAll('.stat-number[data-count]').forEach(counter => {
        if (counter.dataset.animated) return;
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current);
        }, 16);
        counter.dataset.animated = 'true';
    });
}

// --- REVEAL ON SCROLL ---
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.querySelector('.stat-number')) {
                animateCounters();
            }
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.activity-card, .level-card, .testimonial-card, .value-item, .period-card, .contact-card, .about-number, .location-card').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// Observe hero stats
const heroStats = document.querySelector('.hero-stats');
if (heroStats) revealObserver.observe(heroStats);

// Start counters right away since hero is visible on load
setTimeout(animateCounters, 500);

// --- INSCRIPTION FORM ---
const inscriptionForm = document.getElementById('inscriptionForm');
const activitySelect = document.getElementById('activity');
const periodSelect = document.getElementById('period');

// Dynamic price display
function updatePaymentSection() {
    const activity = activitySelect?.value;
    const period = periodSelect?.value;
    let paymentSection = document.getElementById('paymentSection');

    if (!activity || !period) {
        if (paymentSection) paymentSection.classList.remove('active');
        return;
    }

    const price = getPrice(activity, period);
    if (price <= 0) {
        if (paymentSection) paymentSection.classList.remove('active');
        return;
    }

    if (!paymentSection) {
        // Create payment section dynamically
        paymentSection = document.createElement('div');
        paymentSection.id = 'paymentSection';
        paymentSection.className = 'payment-section';
        paymentSection.innerHTML = `
            <h4>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Paiement
            </h4>
            <div class="price-display"><span id="priceAmount"></span> <small id="priceLabel">/ saison</small></div>
            <div class="payment-methods">
                <button type="button" class="payment-method" data-method="card" onclick="selectPayment(this)">
                    Carte bancaire
                </button>
                <button type="button" class="payment-method" data-method="bancontact" onclick="selectPayment(this)">
                    Bancontact
                </button>
                <button type="button" class="payment-method" data-method="virement" onclick="selectPayment(this)">
                    Virement
                </button>
            </div>
            <div id="paymentDetails" class="payment-details-box" style="display:none;">
                <p id="paymentInfo"></p>
            </div>
        `;
        // Insert before the submit button
        const submitBtn = inscriptionForm.querySelector('button[type="submit"]');
        inscriptionForm.insertBefore(paymentSection, submitBtn);
    }

    document.getElementById('priceAmount').textContent = price + '\u20AC';
    document.getElementById('priceLabel').textContent = activity.startsWith('natation') ? '/ saison complete' : '/ semaine de stage';
    paymentSection.classList.add('active');
}

if (activitySelect) activitySelect.addEventListener('change', updatePaymentSection);
if (periodSelect) periodSelect.addEventListener('change', updatePaymentSection);

window.selectPayment = function(btn) {
    document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const method = btn.dataset.method;
    const details = document.getElementById('paymentDetails');
    const info = document.getElementById('paymentInfo');

    details.style.display = 'block';

    switch(method) {
        case 'card':
            info.innerHTML = 'Le paiement par carte sera traite de maniere securisee apres validation de votre inscription. Vous recevrez un lien de paiement par email.';
            break;
        case 'bancontact':
            info.innerHTML = 'Vous recevrez un lien Bancontact par email pour finaliser le paiement.';
            break;
        case 'virement':
            info.innerHTML = '<strong>IBAN :</strong> BE00 0000 0000 0000<br><strong>Communication :</strong> sera envoyee par email apres inscription.<br>Delai : 5 jours ouvrables.';
            break;
    }
};

if (inscriptionForm) {
    inscriptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = inscriptionForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-spinner"></span> Envoi en cours...';

        const formData = new FormData(inscriptionForm);
        const data = Object.fromEntries(formData);

        // Get selected payment method
        const selectedPayment = document.querySelector('.payment-method.selected');
        data.paymentMethod = selectedPayment ? selectedPayment.dataset.method : 'sur place';
        data.price = getPrice(data.activity, data.period);

        // Save to Supabase
        const saved = await saveInscription(data);
        console.log('Inscription saved:', saved);

        // If online payment selected, redirect to Mollie
        if (data.paymentMethod === 'card' || data.paymentMethod === 'bancontact') {
            try {
                const payRes = await fetch('/api/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: data.price,
                        description: `Jump Club - ${data.childName} - ${data.activity}`,
                        inscriptionId: saved.id
                    })
                });
                const payData = await payRes.json();
                if (payData.checkoutUrl) {
                    window.location.href = payData.checkoutUrl;
                    return;
                }
            } catch (err) {
                console.error('Payment error:', err);
            }
        }

        // If virement or sur place, show success
        document.getElementById('successModal').classList.add('active');
        inscriptionForm.reset();
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection) paymentSection.classList.remove('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg> Envoyer l\'inscription';
    });
}

// --- CONTACT FORM ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('successModal').classList.add('active');
        contactForm.reset();
    });
}

// --- MODAL ---
window.closeModal = function() {
    document.getElementById('successModal').classList.remove('active');
};

document.getElementById('successModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

// --- ADMIN PANEL ---
function createAdminPanel() {
    // Admin trigger button
    const trigger = document.createElement('button');
    trigger.className = 'admin-trigger';
    trigger.title = 'Base de donnees';
    trigger.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>';
    trigger.onclick = toggleAdmin;
    document.body.appendChild(trigger);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.id = 'adminOverlay';
    overlay.onclick = toggleAdmin;
    document.body.appendChild(overlay);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.id = 'adminPanel';
    panel.innerHTML = `
        <div class="admin-header">
            <h3>Base de donnees — Inscriptions</h3>
            <button class="admin-close" onclick="toggleAdmin()">&times;</button>
        </div>
        <div class="admin-content">
            <div class="admin-stats" id="adminStats"></div>
            <div class="admin-filters" id="adminFilters">
                <button class="admin-filter active" data-filter="all" onclick="filterAdmin('all', this)">Tous</button>
                <button class="admin-filter" data-filter="natation" onclick="filterAdmin('natation', this)">Natation</button>
                <button class="admin-filter" data-filter="stage" onclick="filterAdmin('stage', this)">Stages</button>
                <button class="admin-filter" data-filter="paid" onclick="filterAdmin('paid', this)">Payes</button>
                <button class="admin-filter" data-filter="pending" onclick="filterAdmin('pending', this)">En attente</button>
            </div>
            <div id="adminTableWrapper"></div>
            <div class="admin-export">
                <button class="btn btn-outline" onclick="exportCSV()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Exporter CSV
                </button>
                <button class="btn btn-outline" onclick="exportJSON()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Exporter JSON
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    updateAdminPanel();
}

window.toggleAdmin = function() {
    const panel = document.getElementById('adminPanel');
    const overlay = document.getElementById('adminOverlay');
    panel.classList.toggle('open');
    overlay.classList.toggle('active');
    if (panel.classList.contains('open')) {
        updateAdminPanel();
    }
};

let currentFilter = 'all';

window.filterAdmin = function(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.admin-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateAdminPanel();
};

async function updateAdminPanel() {
    const inscriptions = await getInscriptions();
    const statsEl = document.getElementById('adminStats');
    const tableWrapper = document.getElementById('adminTableWrapper');
    if (!statsEl || !tableWrapper) return;

    // Stats
    const total = inscriptions.length;
    const paid = inscriptions.filter(i => i.payment_status === 'paid').length;
    const revenue = inscriptions.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + (i.price || 0), 0);

    statsEl.innerHTML = `
        <div class="admin-stat"><span class="num">${total}</span><span class="label">Inscrits</span></div>
        <div class="admin-stat"><span class="num">${paid}</span><span class="label">Payes</span></div>
        <div class="admin-stat"><span class="num">${revenue}\u20AC</span><span class="label">Revenus</span></div>
    `;

    // Filter
    let filtered = inscriptions;
    switch(currentFilter) {
        case 'natation': filtered = inscriptions.filter(i => i.activity?.startsWith('natation')); break;
        case 'stage': filtered = inscriptions.filter(i => i.activity?.startsWith('stage')); break;
        case 'paid': filtered = inscriptions.filter(i => i.payment_status === 'paid'); break;
        case 'pending': filtered = inscriptions.filter(i => i.payment_status === 'pending'); break;
    }

    // Sort by group
    filtered.sort((a, b) => (a.group_name || '').localeCompare(b.group_name || ''));

    if (filtered.length === 0) {
        tableWrapper.innerHTML = `
            <div class="no-data">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                <p>Aucune inscription pour le moment.</p>
            </div>
        `;
        return;
    }

    // Group by group name
    const groups = {};
    filtered.forEach(i => {
        const g = i.group_name || 'Non assigne';
        if (!groups[g]) groups[g] = [];
        groups[g].push(i);
    });

    let html = '';
    for (const [groupName, members] of Object.entries(groups)) {
        const groupColor = groupName.includes('Natation') ? '#2196F3' : '#FF6B35';
        html += `<h4 style="margin: 20px 0 10px; font-size: 0.9rem; color: ${groupColor}; display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${groupColor}; display: inline-block;"></span>
            ${groupName} (${members.length})
        </h4>`;
        html += `<table class="admin-table"><thead><tr>
            <th>Enfant</th><th>Age</th><th>Parent</th><th>Paiement</th><th>Statut</th><th>Actions</th>
        </tr></thead><tbody>`;
        members.forEach(m => {
            const statusClass = m.payment_status === 'paid' ? 'paid' : 'pending';
            const statusText = m.payment_status === 'paid' ? 'Paye' : 'En attente';
            html += `<tr>
                <td><strong>${m.child_name || '-'}</strong></td>
                <td>${m.child_age || '-'} ans</td>
                <td>${m.parent_name || '-'}<br><small style="color:#8e8e9e">${m.parent_email || ''}</small></td>
                <td>${m.price || 0}\u20AC<br><small style="color:#8e8e9e">${m.payment_method || '-'}</small></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${m.payment_status === 'pending' ? `<button onclick="markPaid(${m.id})" style="background:none;border:none;color:#4CAF50;cursor:pointer;font-size:0.8rem;font-weight:600;font-family:var(--font);">Valider</button>` : ''}
                    <button onclick="deleteInscription(${m.id})" style="background:none;border:none;color:#F44336;cursor:pointer;font-size:0.8rem;font-family:var(--font);margin-left:4px;">Suppr.</button>
                </td>
            </tr>`;
        });
        html += `</tbody></table>`;
    }

    tableWrapper.innerHTML = html;
}

window.markPaid = async function(id) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/inscriptions?id=eq.${id}`, {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ payment_status: 'paid' })
        });
    } catch (e) { console.error(e); }
    updateAdminPanel();
};

window.deleteInscription = async function(id) {
    if (!confirm('Supprimer cette inscription ?')) return;
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/inscriptions?id=eq.${id}`, {
            method: 'DELETE',
            headers: supabaseHeaders
        });
    } catch (e) { console.error(e); }
    updateAdminPanel();
};

window.exportCSV = async function() {
    const inscriptions = await getInscriptions();
    if (inscriptions.length === 0) return alert('Aucune donnee a exporter.');
    const headers = ['ID', 'Date', 'Enfant', 'Age', 'Activite', 'Periode', 'Groupe', 'Parent', 'Email', 'Telephone', 'Prix', 'Paiement', 'Statut'];
    const rows = inscriptions.map(i => [
        i.id, new Date(i.created_at).toLocaleDateString('fr-BE'), i.child_name, i.child_age,
        i.activity, i.period, i.group_name, i.parent_name, i.parent_email, i.parent_phone,
        i.price, i.payment_method, i.payment_status
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadFile(csv, 'inscriptions_jump.csv', 'text/csv');
};

window.exportJSON = async function() {
    const inscriptions = await getInscriptions();
    if (inscriptions.length === 0) return alert('Aucune donnee a exporter.');
    downloadFile(JSON.stringify(inscriptions, null, 2), 'inscriptions_jump.json', 'application/json');
};

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// --- STAGE TABS ---
window.switchStageTab = function(tab, btn) {
    document.querySelectorAll('.location-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
};

// --- SMOOTH SCROLL ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    createAdminPanel();
    animateCounters();
});
