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
        'natation-ixelles': { 'saison-2026-2027': 250 },
        'natation-molenbeek': { 'saison-2026-2027': 210 },
        'stage-start-molenbeek': { carnaval: 70, paques: 70, ete: 70, toussaint: 70 },
        'stage-boost-molenbeek': { carnaval: 80, paques: 80, ete: 80, toussaint: 80 },
        'stage-go-molenbeek': { carnaval: 90, paques: 90, ete: 90, toussaint: 90 },
        'stage-start-uccle': { carnaval: 90, paques: 90, ete: 90, toussaint: 90 },
        'stage-boost-uccle': { carnaval: 100, paques: 100, ete: 100, toussaint: 100 },
        'stage-go-uccle': { carnaval: 110, paques: 110, ete: 110, toussaint: 110 },
    };
    return prices[activity]?.[period] || 0;
}

// --- DYNAMIC PERIOD SELECT ---
const _actSelect = document.getElementById('activity');
const _perSelect = document.getElementById('period');
if (_actSelect && _perSelect) {
    _actSelect.addEventListener('change', function() {
        const val = this.value;
        const isNatation = val.startsWith('natation');
        _perSelect.innerHTML = '';
        if (isNatation) {
            const opt = document.createElement('option');
            opt.value = 'saison-2026-2027';
            opt.textContent = 'Année 2026-2027';
            opt.selected = true;
            _perSelect.appendChild(opt);
        } else {
            const periods = [
                { value: '', text: 'Choisir une période', disabled: true, selected: true },
                { value: 'carnaval-s1', text: 'Carnaval — Semaine 1' },
                { value: 'carnaval-s2', text: 'Carnaval — Semaine 2' },
                { value: 'paques-s1', text: 'Pâques — Semaine 1' },
                { value: 'paques-s2', text: 'Pâques — Semaine 2' },
                { value: 'ete-s1', text: 'Été — Semaine 1' },
                { value: 'ete-s2', text: 'Été — Semaine 2' },
                { value: 'ete-s3', text: 'Été — Semaine 3' },
                { value: 'ete-s4', text: 'Été — Semaine 4' },
                { value: 'ete-s5', text: 'Été — Semaine 5' },
                { value: 'ete-s6', text: 'Été — Semaine 6' },
                { value: 'ete-s7', text: 'Été — Semaine 7' },
                { value: 'toussaint-s1', text: 'Toussaint — Semaine 1' },
                { value: 'toussaint-s2', text: 'Toussaint — Semaine 2' }
            ];
            periods.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.value;
                opt.textContent = p.text;
                if (p.disabled) opt.disabled = true;
                if (p.selected) opt.selected = true;
                _perSelect.appendChild(opt);
            });
        }
    });
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
        const target = parseInt(counter.dataset.count);
        if (parseInt(counter.textContent) === target) return;
        const duration = 2000;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            counter.textContent = Math.floor(progress * target);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
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

// Start counters on load and after short delay
setTimeout(animateCounters, 300);
setTimeout(animateCounters, 1000);
window.addEventListener('load', animateCounters);

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

    if (paymentSection) paymentSection.remove();
    {
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
                <button type="button" class="payment-method" data-method="online" onclick="selectPayment(this)">
                    💳 Payer en ligne
                </button>
                <button type="button" class="payment-method" data-method="cash" onclick="selectPayment(this)">
                    💶 Payer en cash
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
        case 'online':
            info.innerHTML = 'Vous serez redirigé vers notre page de paiement sécurisée après validation du formulaire.';
            break;
        case 'cash':
            info.innerHTML = '<strong>⚠️ Important :</strong> N\'oubliez pas de prendre rendez-vous par email à <a href="mailto:info.jumpasbl@gmail.com" style="color:var(--orange);font-weight:600">info.jumpasbl@gmail.com</a> car l\'inscription n\'est pas validée tant qu\'un administrateur ne l\'a pas confirmée.';
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

        // Send confirmation email
        try {
            await fetch('/api/send-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentEmail: data.parentEmail,
                    parentName: (data.parentLastName || '') + ' ' + (data.parentName || ''),
                    childName: data.childName,
                    childLastName: data.childLastName,
                    childAge: data.childAge,
                    activity: data.activity,
                    period: data.period,
                    paymentMethod: data.paymentMethod
                })
            });
        } catch (err) {
            console.error('Email error:', err);
        }

        // If online payment selected, redirect to Mollie
        if (data.paymentMethod === 'online') {
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
    const trigger = document.createElement('button');
    trigger.className = 'admin-trigger';
    trigger.title = 'Base de donnees';
    trigger.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>';
    trigger.onclick = toggleAdmin;
    document.body.appendChild(trigger);

    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.id = 'adminOverlay';
    overlay.onclick = toggleAdmin;
    document.body.appendChild(overlay);

    const panel = document.createElement('div');
    panel.className = 'admin-panel admin-panel-v2';
    panel.id = 'adminPanel';
    panel.innerHTML = `
        <div class="admin-header">
            <h3>Jump Stage — Inscriptions</h3>
            <button class="admin-close" onclick="toggleAdmin()">&times;</button>
        </div>
        <div class="admin-content">
            <div class="admin-stats" id="adminStats"></div>
            <div class="admin-tabs">
                <button class="admin-tab active" onclick="switchAdminTab('natation-ixelles', this)">🏊 Natation Ixelles</button>
                <button class="admin-tab" onclick="switchAdminTab('natation-molenbeek', this)">🏊 Natation Molenbeek</button>
                <button class="admin-tab" onclick="switchAdminTab('stage-molenbeek', this)">🎯 Stages Molenbeek</button>
                <button class="admin-tab" onclick="switchAdminTab('stage-uccle', this)">🎯 Stages Uccle</button>
                <button class="admin-tab" onclick="switchAdminTab('all', this)">📋 Tout</button>
            </div>
            <div class="admin-search-row">
                <input type="text" id="adminSearch" class="admin-search" placeholder="Rechercher par nom enfant ou parent..." oninput="updateAdminPanel()">
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

function activityLabel(act) {
    const map = {
        'natation-ixelles': 'Natation Ixelles',
        'natation-molenbeek': 'Natation Molenbeek',
        'stage-start-molenbeek': 'Stage Start Molenbeek',
        'stage-boost-molenbeek': 'Stage Boost Molenbeek',
        'stage-go-molenbeek': 'Stage Go Molenbeek',
        'stage-start-uccle': 'Stage Start Uccle',
        'stage-boost-uccle': 'Stage Boost Uccle',
        'stage-go-uccle': 'Stage Go Uccle'
    };
    return map[act] || act;
}

function periodLabel(p) {
    const map = {
        'saison-2026-2027': 'Année 2026-2027',
        'saison-2025-2026': 'Année 2025-2026',
        'carnaval': 'Carnaval',
        'paques': 'Pâques',
        'ete': 'Été',
        'toussaint': 'Toussaint'
    };
    return map[p] || p;
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

let currentFilter = 'natation-ixelles';

window.switchAdminTab = function(tab, btn) {
    currentFilter = tab;
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateAdminPanel();
};

async function updateAdminPanel() {
    const inscriptions = await getInscriptions();
    const statsEl = document.getElementById('adminStats');
    const tableWrapper = document.getElementById('adminTableWrapper');
    if (!statsEl || !tableWrapper) return;

    // Stats globales en haut
    const totalAll = inscriptions.length;
    const paidAll = inscriptions.filter(i => i.payment_status === 'paid').length;
    const revenueAll = inscriptions.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + (i.price || 0), 0);

    const tabLabels = {
        'natation-ixelles': '\uD83C\uDFCA Natation Ixelles',
        'natation-molenbeek': '\uD83C\uDFCA Natation Molenbeek',
        'stage-molenbeek': '\uD83C\uDFAF Stages Molenbeek',
        'stage-uccle': '\uD83C\uDFAF Stages Uccle',
        'all': '\uD83D\uDCCB Tout'
    };

    statsEl.innerHTML = `
        <div class="admin-stat"><span class="num">${totalAll}</span><span class="label">Total inscrits</span></div>
        <div class="admin-stat"><span class="num" style="color:#4CAF50">${paidAll}</span><span class="label">Pay\u00E9s</span></div>
        <div class="admin-stat"><span class="num">${revenueAll}\u20AC</span><span class="label">Encaiss\u00E9</span></div>
    `;

    // Filter by tab
    const searchQuery = (document.getElementById('adminSearch')?.value || '').toLowerCase().trim();
    let filtered = inscriptions;
    switch(currentFilter) {
        case 'natation-ixelles': filtered = filtered.filter(i => i.activity === 'natation-ixelles'); break;
        case 'natation-molenbeek': filtered = filtered.filter(i => i.activity === 'natation-molenbeek'); break;
        case 'stage-molenbeek': filtered = filtered.filter(i => i.activity?.startsWith('stage') && i.activity?.includes('molenbeek')); break;
        case 'stage-uccle': filtered = filtered.filter(i => i.activity?.startsWith('stage') && i.activity?.includes('uccle')); break;
    }

    if (searchQuery) {
        filtered = filtered.filter(i =>
            (i.child_name || '').toLowerCase().includes(searchQuery) ||
            (i.parent_name || '').toLowerCase().includes(searchQuery) ||
            (i.parent_email || '').toLowerCase().includes(searchQuery)
        );
    }

    // Sort by group then date
    filtered.sort((a, b) => {
        const g = (a.group_name || '').localeCompare(b.group_name || '');
        if (g !== 0) return g;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    if (filtered.length === 0) {
        tableWrapper.innerHTML = `
            <div class="no-data">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                <p>Aucune inscription.</p>
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
        const isNatation = groupName.includes('Natation');
        const groupColor = isNatation ? '#2196F3' : '#FF6B35';
        const groupBg = isNatation ? 'rgba(33,150,243,0.08)' : 'rgba(255,107,53,0.08)';
        const groupPaid = members.filter(m => m.payment_status === 'paid').length;
        const groupRevenue = members.filter(m => m.payment_status === 'paid').reduce((s, m) => s + (m.price || 0), 0);

        html += `
        <div class="group-section">
            <div class="group-section-header" style="background:${groupBg};border-left:4px solid ${groupColor}">
                <div>
                    <h4 style="color:${groupColor}">${groupName}</h4>
                    <span class="group-section-meta">${members.length} inscrit${members.length > 1 ? 's' : ''} &middot; ${groupPaid} paye${groupPaid > 1 ? 's' : ''} &middot; ${groupRevenue}\u20AC encaisse${groupRevenue > 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="fiches-grid">
        `;

        members.forEach(m => {
            const isPaid = m.payment_status === 'paid';
            const date = m.created_at ? new Date(m.created_at).toLocaleDateString('fr-BE') : '-';
            html += `
            <div class="fiche ${isPaid ? 'fiche-paid' : 'fiche-pending'}">
                <div class="fiche-header">
                    <div class="fiche-name">
                        <span class="fiche-initial" style="background:${groupColor}">${(m.child_name || '?').charAt(0).toUpperCase()}</span>
                        <div>
                            <strong>${m.child_name || '-'}</strong>
                            <span class="fiche-age">${m.child_age || '-'} ans</span>
                        </div>
                    </div>
                    <span class="status-badge ${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Paye' : 'En attente'}</span>
                </div>
                <div class="fiche-body">
                    <div class="fiche-row">
                        <span class="fiche-label">Activite</span>
                        <span class="fiche-value">${activityLabel(m.activity)}</span>
                    </div>
                    <div class="fiche-row">
                        <span class="fiche-label">Periode</span>
                        <span class="fiche-value">${periodLabel(m.period)}</span>
                    </div>
                    <div class="fiche-row">
                        <span class="fiche-label">Parent</span>
                        <span class="fiche-value">${m.parent_name || '-'}</span>
                    </div>
                    <div class="fiche-row">
                        <span class="fiche-label">Email</span>
                        <span class="fiche-value fiche-contact"><a href="mailto:${m.parent_email}">${m.parent_email || '-'}</a></span>
                    </div>
                    <div class="fiche-row">
                        <span class="fiche-label">Telephone</span>
                        <span class="fiche-value fiche-contact"><a href="tel:${m.parent_phone}">${m.parent_phone || '-'}</a></span>
                    </div>
                    <div class="fiche-row">
                        <span class="fiche-label">Montant</span>
                        <span class="fiche-value fiche-price">${m.price || 0}\u20AC <small>(${m.payment_method || 'n/a'})</small></span>
                    </div>
                    ${m.message ? `<div class="fiche-row fiche-message"><span class="fiche-label">Message</span><span class="fiche-value">${m.message}</span></div>` : ''}
                    <div class="fiche-row fiche-date-row">
                        <span class="fiche-label">Inscrit le</span>
                        <span class="fiche-value">${date}</span>
                    </div>
                </div>
                <div class="fiche-actions">
                    ${!isPaid ? `<button class="fiche-btn fiche-btn-validate" onclick="markPaid(${m.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Valider paiement</button>` : ''}
                    <button class="fiche-btn fiche-btn-delete" onclick="deleteInscription(${m.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </div>`;
        });

        html += `</div></div>`;
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

    // Secret admin : 5 clics sur le logo = ouvre le dashboard
    let logoClicks = 0;
    let logoTimer = null;
    const logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            logoClicks++;
            clearTimeout(logoTimer);
            logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
            if (logoClicks >= 5) {
                e.preventDefault();
                logoClicks = 0;
                toggleAdmin();
            }
        });
    }
});
