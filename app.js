/* ══════════════════════════════════════════════
   LEADPILOT — APP LOGIC
   Client-side demo. State persists in localStorage.
══════════════════════════════════════════════ */

const STORE_KEY = 'leadpilot_state_v1';
const CHANNEL_LABEL = { call: 'Call', ai: 'AI', fb: 'Facebook', google: 'Google', web: 'Web Chat', form: 'Web Form' };
const CHANNEL_ICON  = { call: 'phone', ai: 'sparkle', fb: 'message', google: 'globe', web: 'chat', form: 'doc' };

/* line-icon set (stroke inherits from .ico svg in CSS) */
const ICONS = {
  phone:   '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.8.4 1.6.7 2.3a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.7-1.3a2 2 0 0 1 2.1-.4c.7.3 1.5.6 2.3.7a2 2 0 0 1 1.8 2z"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  message: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.5 8.5 0 0 1-3.8-.9L3 20.5l1.4-4.2a8.4 8.4 0 0 1-.9-3.8A8.4 8.4 0 0 1 12 4a8.4 8.4 0 0 1 9 7.5z"/></svg>',
  globe:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>',
  chat:    '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg>',
  doc:     '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>',
  inbox:   '<svg viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"/></svg>',
  clock:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  coins:   '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="5"/><path d="M18.1 8.6a5 5 0 1 1-6.5 6.5"/></svg>',
  gear:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5 2 2 0 0 1-4 0 1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8 1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1 2 2 0 0 1 0-4 1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5 2 2 0 0 1 4 0 1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3 2 2 0 1 1 2.8 2.8 1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1 2 2 0 0 1 0 4 1.6 1.6 0 0 0-1.5 1z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v5h-5"/></svg>',
  check:   '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  ring:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>',
};
function icon(name) { return '<span class="ico">' + (ICONS[name] || '') + '</span>'; }

/* ───────────── STATE ───────────── */
function now() { return Date.now(); }
function mins(n) { return n * 60 * 1000; }

function seedState() {
  const t = now();
  return {
    business: { name: 'Summit HVAC', number: '(555) 018-2245', industry: 'HVAC & Heating', plan: 'Growth' },
    ai: { enabled: true },
    kpi: { leadsToday: 18, callsRecovered: 6, recoveredValue: 4200, afterHoursSaves: 4 },
    leads: [
      {
        id: 'l1', name: 'Dana Reyes', initials: 'DR', channel: 'call', status: 'booked', value: 850,
        missed: true, autoTextSent: true, unread: true, lastActivity: t - mins(4),
        messages: [
          { from: 'sys', text: 'Missed call from (555) 402-1187', time: t - mins(6) },
          { from: 'out', sender: 'LeadPilot (auto)', ai: true, text: 'Hi! Sorry we missed your call at Summit HVAC. How can we help? Reply here and a team member will jump right in.', time: t - mins(6) },
          { from: 'in', text: 'Yes please! My AC stopped cooling last night, can someone come today?', time: t - mins(4) },
          { from: 'out', sender: 'You', text: 'Absolutely Dana — we have a slot at 3pm today. Want me to book it?', time: t - mins(3) },
          { from: 'in', text: 'Perfect, book it!', time: t - mins(2) },
        ],
      },
      {
        id: 'l2', name: 'Marcus Lang', initials: 'ML', channel: 'ai', status: 'booked', value: 1200,
        aiHandled: true, unread: false, lastActivity: t - mins(38),
        messages: [
          { from: 'in', text: 'Do you install heat pumps?', time: t - mins(44) },
          { from: 'out', sender: 'AI Receptionist', ai: true, text: 'We do! We install and service all major heat pump brands. Are you looking for a new install or a replacement?', time: t - mins(43) },
          { from: 'in', text: 'New install for a 2000 sq ft house', time: t - mins(41) },
          { from: 'out', sender: 'AI Receptionist', ai: true, text: 'Great — I can book a free in-home estimate. We have Thursday at 2pm open. Does that work?', time: t - mins(40) },
          { from: 'in', text: 'Thursday 2pm works', time: t - mins(38) },
          { from: 'out', sender: 'AI Receptionist', ai: true, text: "You're booked for Thursday at 2pm. You'll get a text reminder the day before. See you then!", time: t - mins(38) },
        ],
      },
      {
        id: 'l3', name: 'Priya Sharma', initials: 'PS', channel: 'fb', status: 'contacted', value: 600,
        unread: true, lastActivity: t - mins(52),
        messages: [
          { from: 'in', text: 'Hi, saw your ad — do you do furnace tune-ups before winter?', time: t - mins(55) },
          { from: 'out', sender: 'You', text: 'We sure do! A tune-up is $129 and takes about an hour. When works for you?', time: t - mins(52) },
        ],
      },
      {
        id: 'l4', name: 'Tom Holbrook', initials: 'TH', channel: 'web', status: 'new', value: 400,
        aiHandled: true, unread: false, lastActivity: t - mins(70),
        messages: [
          { from: 'in', text: 'How much for a service call?', time: t - mins(72) },
          { from: 'out', sender: 'AI Receptionist', ai: true, text: 'Our standard diagnostic visit is $89, which is credited toward any repair. Would you like to schedule one?', time: t - mins(71) },
          { from: 'in', text: 'Let me check my schedule and get back to you', time: t - mins(70) },
        ],
      },
      {
        id: 'l5', name: 'Angela Cruz', initials: 'AC', channel: 'google', status: 'won', value: 2400,
        unread: false, lastActivity: t - mins(180),
        messages: [
          { from: 'in', text: 'Need a full AC system replacement quote', time: t - mins(200) },
          { from: 'out', sender: 'You', text: 'Happy to help! We came out and quoted $6,200 installed. Ready when you are.', time: t - mins(190) },
          { from: 'in', text: 'Approved — let\'s do it next week', time: t - mins(180) },
        ],
      },
      {
        id: 'l6', name: 'Derek Obi', initials: 'DO', channel: 'call', status: 'contacted', value: 300,
        missed: true, autoTextSent: true, unread: false, lastActivity: t - mins(240),
        messages: [
          { from: 'sys', text: 'Missed call from (555) 771-9043', time: t - mins(242) },
          { from: 'out', sender: 'LeadPilot (auto)', ai: true, text: 'Hi! Sorry we missed your call at Summit HVAC. How can we help?', time: t - mins(242) },
          { from: 'in', text: 'Thermostat not turning on', time: t - mins(240) },
        ],
      },
      {
        id: 'l7', name: 'Nina Patel', initials: 'NP', channel: 'form', status: 'new', value: 500,
        unread: true, lastActivity: t - mins(300),
        messages: [
          { from: 'in', text: 'Website form: "Requesting a quote for duct cleaning — 4 bedroom house."', time: t - mins(300) },
        ],
      },
      {
        id: 'l8', name: 'Sam Whitfield', initials: 'SW', channel: 'ai', status: 'booked', value: 750,
        aiHandled: true, afterHours: true, unread: false, lastActivity: t - mins(520),
        messages: [
          { from: 'sys', text: 'Web chat at 11:42pm (after hours)', time: t - mins(522) },
          { from: 'in', text: 'My heater is making a loud banging noise', time: t - mins(522) },
          { from: 'out', sender: 'AI Receptionist', ai: true, text: "That sounds like it needs a look. I can get a technician out first thing tomorrow at 8am — shall I book it?", time: t - mins(521) },
          { from: 'in', text: 'Yes thank you', time: t - mins(520) },
          { from: 'out', sender: 'AI Receptionist', ai: true, text: "Booked for 8am tomorrow. A human from Summit HVAC will confirm in the morning. Sleep easy!", time: t - mins(520) },
        ],
      },
    ],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const s = seedState();
  saveState(s);
  return s;
}
function saveState(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }

let STATE = null;
let activeThreadId = null;

/* ───────────── HELPERS ───────────── */
function relTime(ts) {
  const d = now() - ts;
  if (d < mins(1)) return 'just now';
  if (d < mins(60)) return Math.floor(d / mins(1)) + 'm ago';
  if (d < mins(60) * 24) return Math.floor(d / (mins(60))) + 'h ago';
  return Math.floor(d / (mins(60) * 24)) + 'd ago';
}
function clockTime(ts) {
  const dt = new Date(ts);
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function money(n) { return '$' + n.toLocaleString('en-US'); }
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ═══════════════════════════════════════════════
   APP
═══════════════════════════════════════════════ */
function initApp() {
  STATE = loadState();

  // nav switching
  document.querySelectorAll('.app-nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // mobile menu
  const menuBtn = document.getElementById('app-menu-btn');
  const sidebar = document.getElementById('app-sidebar');
  if (menuBtn) menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.querySelectorAll('.app-nav-item').forEach(b => b.addEventListener('click', () => sidebar.classList.remove('open')));

  // simulate
  document.getElementById('btn-simulate').addEventListener('click', simulateLead);

  // AI toggle
  const aiToggle = document.getElementById('ai-toggle');
  if (aiToggle) {
    aiToggle.checked = STATE.ai.enabled;
    aiToggle.addEventListener('change', () => {
      STATE.ai.enabled = aiToggle.checked;
      saveState(STATE);
      document.getElementById('ai-status-text').textContent = STATE.ai.enabled
        ? 'Active · answering calls & web chat 24/7'
        : 'Paused · leads will wait for a human';
      document.querySelector('.ai-orb').style.opacity = STATE.ai.enabled ? '' : '0.3';
      toast('sparkle', STATE.ai.enabled ? 'AI Receptionist on' : 'AI Receptionist paused',
        STATE.ai.enabled ? 'It will answer new calls and chats automatically.' : 'New conversations will queue for your team.');
    });
  }

  // contact search
  const search = document.getElementById('contact-search');
  if (search) search.addEventListener('input', () => renderContacts(search.value));

  // settings save / reset
  const saveBtn = document.getElementById('settings-save');
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) resetBtn.addEventListener('click', resetDemo);

  // bell clears
  const bell = document.getElementById('app-bell');
  if (bell) bell.addEventListener('click', () => setBell(0));

  applyBusinessToUI();
  renderAll();
}

function applyBusinessToUI() {
  const b = STATE.business;
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('app-biz-name', b.name);
  set('plan-name', b.plan);
  const av = document.getElementById('app-avatar');
  if (av) av.textContent = b.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const setVal = (id, val) => { const e = document.getElementById(id); if (e) e.value = val; };
  setVal('set-biz', b.name);
  setVal('set-number', b.number);
  setVal('set-industry', b.industry);
}

function switchView(view) {
  document.querySelectorAll('.app-nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.app-view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
  const titles = { dashboard: 'Dashboard', inbox: 'Inbox', missed: 'Missed Calls', ai: 'AI Receptionist', contacts: 'Contacts', settings: 'Settings' };
  document.getElementById('view-title').textContent = titles[view] || 'Dashboard';
  if (view === 'contacts') renderContacts(document.getElementById('contact-search').value);
}

/* ───────────── RENDER ───────────── */
function renderAll() {
  renderKPIs();
  renderActivity();
  renderSources();
  renderInbox();
  renderMissed();
  renderAI();
  renderContacts('');
  renderCounts();
}

function renderCounts() {
  const unread = STATE.leads.filter(l => l.unread).length;
  const missed = STATE.leads.filter(l => l.missed && l.status !== 'won' && l.status !== 'booked').length;
  const ci = document.getElementById('count-inbox');
  const cm = document.getElementById('count-missed');
  if (ci) ci.textContent = unread;
  if (cm) cm.textContent = STATE.leads.filter(l => l.missed).length;
}

function renderKPIs() {
  const row = document.getElementById('kpi-row');
  if (!row) return;
  const k = STATE.kpi;
  const cards = [
    { ico: 'inbox', delta: '+12%', num: k.leadsToday, label: 'Leads captured today' },
    { ico: 'phone', delta: '+3', num: k.callsRecovered, label: 'Missed calls recovered' },
    { ico: 'clock', delta: 'fast', num: '27s', label: 'Avg. response time' },
    { ico: 'coins', delta: '+8%', num: money(k.recoveredValue), label: 'Revenue recovered', gold: true },
  ];
  row.innerHTML = '';
  cards.forEach(c => {
    row.appendChild(el(`
      <div class="kpi ${c.gold ? 'accent' : ''}">
        <div class="kpi-top"><span class="kpi-ico">${icon(c.ico)}</span><span class="kpi-delta">${c.delta}</span></div>
        <div class="kpi-num">${c.num}</div>
        <div class="kpi-label">${c.label}</div>
      </div>`));
  });
}

function activityText(l) {
  if (l.channel === 'call' && l.missed) return `Missed call auto-texted <strong>${esc(l.name)}</strong> — ${l.status === 'new' ? 'awaiting reply' : 'they replied'}`;
  if (l.channel === 'ai') return `AI ${l.status === 'booked' ? 'booked' : 'handled'} <strong>${esc(l.name)}</strong>`;
  if (l.channel === 'fb') return `New Facebook lead <strong>${esc(l.name)}</strong>`;
  if (l.channel === 'google') return `Google message from <strong>${esc(l.name)}</strong>`;
  if (l.channel === 'web') return `Web chat with <strong>${esc(l.name)}</strong>`;
  if (l.channel === 'form') return `Website form from <strong>${esc(l.name)}</strong>`;
  return `New lead <strong>${esc(l.name)}</strong>`;
}

function renderActivity() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  const items = [...STATE.leads].sort((a, b) => b.lastActivity - a.lastActivity);
  feed.innerHTML = '';
  items.forEach((l, i) => {
    feed.appendChild(el(`
      <div class="activity-item ${i === 0 && l._fresh ? 'fresh' : ''}">
        <div class="act-icon bg-${l.channel}">${icon(CHANNEL_ICON[l.channel])}</div>
        <div class="act-body">
          <div class="act-title">${activityText(l)}</div>
          <div class="act-meta"><span class="chan-tag c-${l.channel}">${CHANNEL_LABEL[l.channel]}</span> · ${relTime(l.lastActivity)}${l.value ? ' · ' + money(l.value) + ' potential' : ''}</div>
        </div>
      </div>`));
    l._fresh = false;
  });
}

function renderSources() {
  const wrap = document.getElementById('source-bars');
  const rec = document.getElementById('recovered-num');
  if (rec) rec.textContent = money(STATE.kpi.recoveredValue + 8600);
  if (!wrap) return;
  const counts = {};
  STATE.leads.forEach(l => { counts[l.channel] = (counts[l.channel] || 0) + 1; });
  // brown family for human/phone, baby-blue family for digital
  const colors = { call: '#7A5A42', ai: '#9A7757', fb: '#5E93AC', google: '#7FAAC0', web: '#9DC3D6', form: '#BBD7E2' };
  const total = STATE.leads.length || 1;
  const order = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  wrap.innerHTML = '';
  order.forEach(ch => {
    const pct = Math.round((counts[ch] / total) * 100);
    wrap.appendChild(el(`
      <div class="source-bar-row">
        <div class="source-bar-top"><span>${CHANNEL_LABEL[ch]}</span><strong>${counts[ch]} · ${pct}%</strong></div>
        <div class="source-bar-track"><div class="source-bar-fill" style="width:${pct}%;background:${colors[ch]}"></div></div>
      </div>`));
  });
}

function renderInbox() {
  const list = document.getElementById('inbox-list');
  if (!list) return;
  const items = [...STATE.leads].sort((a, b) => b.lastActivity - a.lastActivity);
  list.innerHTML = '';
  items.forEach(l => {
    const last = l.messages[l.messages.length - 1];
    const preview = last ? (last.from === 'out' ? 'You: ' : '') + last.text : '';
    const item = el(`
      <div class="inbox-item ${l.unread ? 'unread' : ''} ${l.id === activeThreadId ? 'active' : ''}" data-id="${l.id}">
        <div class="inbox-ava">${l.initials}</div>
        <div class="inbox-meta">
          <div class="inbox-top"><span class="inbox-name">${esc(l.name)}</span><span class="inbox-time">${relTime(l.lastActivity)}</span></div>
          <div class="inbox-preview">${esc(preview)}</div>
          <div class="inbox-badges"><span class="chan-tag c-${l.channel}">${CHANNEL_LABEL[l.channel]}</span>${l.unread ? '<span class="unread-dot"></span>' : ''}</div>
        </div>
      </div>`);
    item.addEventListener('click', () => openThread(l.id));
    list.appendChild(item);
  });
}

function openThread(id) {
  activeThreadId = id;
  const lead = STATE.leads.find(l => l.id === id);
  if (!lead) return;
  lead.unread = false;
  saveState(STATE);
  renderInbox();
  renderCounts();

  document.getElementById('thread-empty').style.display = 'none';
  document.getElementById('thread-body').style.display = 'flex';
  document.getElementById('thread-head').innerHTML = `
    <div class="inbox-ava">${lead.initials}</div>
    <div class="thread-head-info">
      <strong>${esc(lead.name)}</strong>
      <span><span class="chan-tag c-${lead.channel}">${CHANNEL_LABEL[lead.channel]}</span> · ${lead.value ? money(lead.value) + ' potential' : 'lead'}</span>
    </div>
    <span class="status-pill status-${lead.status}">${lead.status}</span>`;

  const msgs = document.getElementById('thread-messages');
  msgs.innerHTML = '';
  lead.messages.forEach(m => {
    if (m.from === 'sys') {
      msgs.appendChild(el(`<div class="msg-time" style="text-align:center;margin:2px auto">— ${esc(m.text)} · ${clockTime(m.time)} —</div>`));
      return;
    }
    const out = m.from === 'out';
    msgs.appendChild(el(`
      <div class="msg ${out ? 'msg-out' : 'msg-in'} ${m.ai ? 'ai' : ''}">
        ${out && m.sender ? `<div class="msg-sender">${esc(m.sender)}</div>` : ''}
        <div class="msg-bubble">${esc(m.text)}</div>
        <div class="msg-time">${clockTime(m.time)}</div>
      </div>`));
  });
  msgs.scrollTop = msgs.scrollHeight;
}

function sendReply(e) {
  e.preventDefault();
  const input = document.getElementById('reply-input');
  const text = input.value.trim();
  if (!text || !activeThreadId) return false;
  const lead = STATE.leads.find(l => l.id === activeThreadId);
  lead.messages.push({ from: 'out', sender: 'You', text, time: now() });
  lead.lastActivity = now();
  if (lead.status === 'new') lead.status = 'contacted';
  saveState(STATE);
  input.value = '';
  openThread(activeThreadId);
  renderInbox();
  renderActivity();
  return false;
}

function renderMissed() {
  const list = document.getElementById('missed-list');
  if (!list) return;
  const missed = STATE.leads.filter(l => l.missed).sort((a, b) => b.lastActivity - a.lastActivity);
  list.innerHTML = '';
  if (!missed.length) { list.appendChild(el('<p style="color:var(--mauve-light)">No missed calls yet — hit “Simulate incoming lead” to see it in action.</p>')); return; }
  missed.forEach(l => {
    const replied = l.messages.some(m => m.from === 'in');
    const recovered = replied;
    list.appendChild(el(`
      <div class="missed-card ${recovered ? 'recovered' : ''}">
        <div class="missed-phone-ico">${icon('phone')}</div>
        <div class="missed-info">
          <strong>${esc(l.name)}</strong>
          <div class="missed-num">Called ${relTime(l.lastActivity)}</div>
          <div class="missed-flow">
            <div class="missed-flow-step"><span class="mf-check ico">${ICONS.check}</span> Auto-text sent in 24s</div>
            <div class="missed-flow-step"><span class="mf-check ico ${replied ? '' : 'pending'}">${replied ? ICONS.check : ICONS.ring}</span> ${replied ? 'Customer replied' : 'Waiting for reply'}</div>
          </div>
        </div>
        <div class="missed-right">
          <span class="missed-status ${recovered ? 'recovered' : 'pending'}">${recovered ? 'Recovered' : 'Pending'}</span>
          <div class="missed-time">${l.value ? money(l.value) + ' job' : ''}</div>
        </div>
      </div>`));
  });
}

function renderAI() {
  const wrap = document.getElementById('ai-convos');
  const aiLeads = STATE.leads.filter(l => l.aiHandled);
  const setN = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setN('ai-answered', aiLeads.length);
  setN('ai-booked', aiLeads.filter(l => l.status === 'booked').length);
  setN('ai-afterhours', STATE.leads.filter(l => l.afterHours).length);
  if (!wrap) return;
  wrap.innerHTML = '';
  aiLeads.sort((a, b) => b.lastActivity - a.lastActivity).forEach(l => {
    const lines = l.messages.filter(m => m.from === 'in' || m.from === 'out').map(m => `
      <div class="ai-line ${m.from === 'in' ? 'caller' : 'bot'}"><span class="who">${m.from === 'in' ? esc(l.name) : 'AI'}:</span> <span class="txt">${esc(m.text)}</span></div>`).join('');
    wrap.appendChild(el(`
      <div class="ai-convo">
        <div class="ai-convo-head">
          <strong>${esc(l.name)}</strong>
          <span class="chan-tag c-${l.channel}">${CHANNEL_LABEL[l.channel]}</span>
          ${l.afterHours ? '<span class="chan-tag c-ai">After hours</span>' : ''}
          <span class="ai-outcome">${l.status === 'booked' ? 'Appointment booked' : 'Qualified'}</span>
        </div>
        <div class="ai-transcript">${lines}</div>
      </div>`));
  });
}

function renderContacts(query) {
  const body = document.getElementById('contacts-body');
  const countEl = document.getElementById('contacts-count');
  if (!body) return;
  const q = (query || '').toLowerCase();
  const rows = STATE.leads.filter(l =>
    !q || l.name.toLowerCase().includes(q) || CHANNEL_LABEL[l.channel].toLowerCase().includes(q) || l.status.includes(q)
  ).sort((a, b) => b.lastActivity - a.lastActivity);
  if (countEl) countEl.textContent = rows.length + (rows.length === 1 ? ' lead' : ' leads');
  // Assign innerHTML directly on <tbody> so the parser keeps <tr> rows
  // (a detached <div> would silently drop table rows).
  body.innerHTML = rows.map(l => `
      <tr>
        <td><span class="contact-name">${esc(l.name)}</span></td>
        <td><span class="chan-tag c-${l.channel}">${CHANNEL_LABEL[l.channel]}</span></td>
        <td><span class="status-pill status-${l.status}">${l.status}</span></td>
        <td>${l.value ? money(l.value) : '—'}</td>
        <td>${relTime(l.lastActivity)}</td>
      </tr>`).join('');
}

/* ───────────── SIMULATE INCOMING LEAD ───────────── */
const SIM_NAMES = ['Jordan Blake', 'Casey Nguyen', 'Riley Foster', 'Morgan Diaz', 'Avery Quinn', 'Taylor Brooks', 'Jamie Soto', 'Cameron Lee', 'Devon Hart', 'Skyler Reed'];
const SIM_SCENARIOS = [
  {
    channel: 'call', missed: true, value: () => rand(300, 1200), status: 'new',
    build: (name) => [
      { from: 'sys', text: 'Missed call from ' + fakeNum(), time: now() },
      { from: 'out', sender: 'LeadPilot (auto)', ai: true, text: `Hi! Sorry we missed your call at ${STATE.business.name}. How can we help? Reply here and a team member will jump right in.`, time: now() },
    ],
    toast: (name) => ['phone', 'Missed call recovered', `Auto-texted <strong>${name}</strong> in 24 seconds before they could call anyone else.`],
    bump: (s) => { s.kpi.callsRecovered++; },
  },
  {
    channel: 'ai', aiHandled: true, value: () => rand(400, 1500), status: 'booked',
    build: (name) => [
      { from: 'in', text: 'Can someone come look at my AC this week?', time: now() },
      { from: 'out', sender: 'AI Receptionist', ai: true, text: 'Absolutely! I have Wednesday at 10am or Friday at 1pm open. Which works better?', time: now() },
      { from: 'in', text: 'Friday 1pm', time: now() },
      { from: 'out', sender: 'AI Receptionist', ai: true, text: "You're booked for Friday at 1pm. You'll get a reminder text. Thanks!", time: now() },
    ],
    toast: (name) => ['sparkle', 'AI booked an appointment', `The AI receptionist qualified <strong>${name}</strong> and booked them — no staff needed.`],
    bump: (s) => { s.kpi.afterHoursSaves++; },
  },
  {
    channel: 'fb', value: () => rand(200, 800), status: 'new',
    build: (name) => [
      { from: 'in', text: 'Saw your Facebook ad — do you offer free estimates?', time: now() },
    ],
    toast: (name) => ['message', 'New Facebook lead', `<strong>${name}</strong> messaged from your Facebook ad and landed in your inbox.`],
    bump: () => {},
  },
  {
    channel: 'web', aiHandled: true, value: () => rand(150, 600), status: 'contacted',
    build: (name) => [
      { from: 'in', text: 'What are your hours?', time: now() },
      { from: 'out', sender: 'AI Receptionist', ai: true, text: "We're open 7am–7pm weekdays, but I can take your request any time. What do you need help with?", time: now() },
    ],
    toast: (name) => ['chat', 'Web chat answered', `The AI answered <strong>${name}</strong> instantly on your website.`],
    bump: () => {},
  },
];

function rand(a, b) { return Math.round((a + Math.random() * (b - a)) / 50) * 50; }
function fakeNum() { return '(555) ' + String(Math.floor(100 + Math.random() * 899)) + '-' + String(Math.floor(1000 + Math.random() * 8999)); }
let simIdx = 0;

function simulateLead() {
  const scenario = SIM_SCENARIOS[simIdx % SIM_SCENARIOS.length];
  simIdx++;
  const name = SIM_NAMES[Math.floor(Math.random() * SIM_NAMES.length)];
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const value = scenario.value();
  const lead = {
    id: 'sim_' + now(),
    name, initials,
    channel: scenario.channel,
    status: scenario.status,
    value,
    missed: !!scenario.missed,
    autoTextSent: !!scenario.missed,
    aiHandled: !!scenario.aiHandled,
    unread: true,
    lastActivity: now(),
    _fresh: true,
    messages: scenario.build(name),
  };
  STATE.leads.push(lead);
  STATE.kpi.leadsToday++;
  STATE.kpi.recoveredValue += value;
  if (scenario.bump) scenario.bump(STATE);
  saveState(STATE);

  // update everything live
  renderAll();
  const [ico, title, body] = scenario.toast(name);
  toast(ico, title, body);
  setBell((parseInt(document.getElementById('bell-badge').textContent) || 0) + 1);

  // flash the relevant nav
  const flash = document.querySelector(`.app-nav-item[data-view="${scenario.missed ? 'missed' : scenario.channel === 'ai' ? 'ai' : 'inbox'}"]`);
  if (flash) { flash.style.transition = 'background .3s'; flash.style.background = 'rgba(232,160,32,0.2)'; setTimeout(() => flash.style.background = '', 700); }
}

function setBell(n) {
  const b = document.getElementById('bell-badge');
  if (!b) return;
  if (n > 0) { b.style.display = 'flex'; b.textContent = n; }
  else { b.style.display = 'none'; b.textContent = '0'; }
}

/* ───────────── TOASTS ───────────── */
function toast(ico, title, body) {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = el(`
    <div class="toast">
      <div class="toast-ico">${icon(ico)}</div>
      <div class="toast-body"><strong>${title}</strong><span>${body}</span></div>
    </div>`);
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 4200);
}

/* ───────────── SETTINGS ───────────── */
function saveSettings() {
  STATE.business.name = document.getElementById('set-biz').value.trim() || STATE.business.name;
  STATE.business.number = document.getElementById('set-number').value.trim();
  STATE.business.industry = document.getElementById('set-industry').value.trim();
  saveState(STATE);
  applyBusinessToUI();
  toast('gear', 'Settings saved', 'Your business profile and automation are up to date.');
}

function resetDemo() {
  localStorage.removeItem(STORE_KEY);
  STATE = loadState();
  activeThreadId = null;
  const tb = document.getElementById('thread-body');
  const te = document.getElementById('thread-empty');
  if (tb) tb.style.display = 'none';
  if (te) te.style.display = '';
  simIdx = 0;
  setBell(0);
  applyBusinessToUI();
  renderAll();
  toast('refresh', 'Demo reset', 'Fresh sample data loaded. Explore away!');
}

// expose for inline handlers
window.initApp = initApp;
window.sendReply = sendReply;
