/* ─────────────────────────────────────────────────
   COMMUNITY SERVICE TRACKER — Frontend Logic
───────────────────────────────────────────────── */

const API = '/api/records';

// ── Utility helpers ──────────────────────────────
function $(id) { return document.getElementById(id); }

function showToast(msg, type = 'success') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${m}/${d}/${y}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ── Tab switching ────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    const panel = $(`tab-${tab.dataset.tab}`);
    panel.classList.remove('hidden');
    if (tab.dataset.tab === 'all') loadAllRecords();
  });
});

// ── Build records table ──────────────────────────
function buildTable(records, container) {
  if (!records || records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No records found.</p>
      </div>`;
    return;
  }

  const totalHours = records.reduce((s, r) => s + parseFloat(r.hours), 0);

  const summary = `
    <div class="summary-strip">
      <span><strong>${records.length}</strong> record${records.length !== 1 ? 's' : ''}</span>
      <span><strong>${totalHours.toFixed(1)}</strong> total hours</span>
    </div>`;

  const rows = records.map(r => `
    <tr>
      <td>${escHtml(r.student_name)}</td>
      <td>${escHtml(r.supervisor_name)}</td>
      <td class="desc-cell" title="${escHtml(r.activity_description)}">${escHtml(r.activity_description)}</td>
      <td><span class="hours-badge">${parseFloat(r.hours).toFixed(1)} hr</span></td>
      <td>${formatDate(r.service_date)}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm" onclick="openEdit(${r.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord(${r.id})">Delete</button>
      </td>
    </tr>`).join('');

  container.innerHTML = summary + `
    <div style="overflow-x:auto">
      <table class="records-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Supervisor</th>
            <th>Activity</th>
            <th>Hours</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── TAB 1: Add record ────────────────────────────
$('service_date').value = todayISO();

$('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save record.');
    showToast('✓ Record saved successfully!', 'success');
    e.target.reset();
    $('service_date').value = todayISO();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ── TAB 2: Search ────────────────────────────────
async function searchRecords() {
  const name = $('search-input').value.trim();
  if (!name) { showToast('Please enter a student name to search.', 'error'); return; }

  $('search-results').innerHTML = '<p style="color:var(--ink-muted);padding:.5rem 0">Searching…</p>';

  try {
    const res = await fetch(`${API}/search?student_name=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed.');
    buildTable(data.records, $('search-results'));
  } catch (err) {
    $('search-results').innerHTML = '';
    showToast(err.message, 'error');
  }
}

$('search-btn').addEventListener('click', searchRecords);
$('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') searchRecords(); });

// ── TAB 3: All records ───────────────────────────
async function loadAllRecords() {
  $('all-records').innerHTML = '<p style="color:var(--ink-muted);padding:.5rem 0">Loading…</p>';
  try {
    const res = await fetch(API);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load records.');
    buildTable(data.records, $('all-records'));
  } catch (err) {
    $('all-records').innerHTML = '';
    showToast(err.message, 'error');
  }
}

$('refresh-btn').addEventListener('click', loadAllRecords);

// ── Edit modal ───────────────────────────────────
async function openEdit(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load record.');
    const r = data.record;
    $('edit-id').value         = r.id;
    $('edit-student').value    = r.student_name;
    $('edit-supervisor').value = r.supervisor_name;
    $('edit-desc').value       = r.activity_description;
    $('edit-hours').value      = r.hours;
    $('edit-date').value       = r.service_date?.split('T')[0] || todayISO();
    $('edit-modal').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal() { $('edit-modal').classList.add('hidden'); }
$('close-modal').addEventListener('click', closeModal);
$('cancel-edit').addEventListener('click', closeModal);
$('edit-modal').addEventListener('click', e => { if (e.target === $('edit-modal')) closeModal(); });

$('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('edit-id').value;
  const body = {
    student_name:         $('edit-student').value.trim(),
    supervisor_name:      $('edit-supervisor').value.trim(),
    activity_description: $('edit-desc').value.trim(),
    hours:                $('edit-hours').value,
    service_date:         $('edit-date').value,
  };

  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed.');
    showToast('✓ Record updated!', 'success');
    closeModal();
    // Refresh whichever tab is visible
    if (!$('tab-all').classList.contains('hidden')) loadAllRecords();
    if (!$('tab-search').classList.contains('hidden')) searchRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ── Delete ───────────────────────────────────────
async function deleteRecord(id) {
  if (!confirm('Delete this record? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed.');
    showToast('Record deleted.', 'success');
    if (!$('tab-all').classList.contains('hidden')) loadAllRecords();
    if (!$('tab-search').classList.contains('hidden')) searchRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Expose edit/delete to inline onclick handlers
window.openEdit = openEdit;
window.deleteRecord = deleteRecord;
