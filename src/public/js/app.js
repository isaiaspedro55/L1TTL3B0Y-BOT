/* ============================================
   DARK BOT — Frontend App JS v6
   ============================================ */

// ===== SOCKET.IO GLOBAL =====
// Usa window.darkBotSocket para evitar conflito com scripts inline que também usam "const socket".
if (typeof io !== 'undefined' && !window.darkBotSocket) {
  window.darkBotSocket = io({ reconnection: true, reconnectionDelay: 2000, reconnectionAttempts: 10 });
  window.darkBotSocket.on('connect', () => console.log('🔌 Socket conectado'));
  window.darkBotSocket.on('disconnect', () => console.log('⚠️ Socket desconectado'));
}

// ===== TOAST (fallback global se não definido no head) =====
if (typeof toast === 'undefined') {
  window.toast = function(msg, type = 'info', duration = 3500) {
    const c = document.getElementById('toastContainer');
    if (!c) { console.log(`[${type}] ${msg}`); return; }
    const icons = { success: '✅', error: '❌', warn: '⚠️', info: '💡' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type] || '💡'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'all 0.3s ease';
      t.style.opacity = '0';
      t.style.transform = 'translateX(120%)';
      setTimeout(() => t.remove(), 320);
    }, duration);
  };
}

// ===== COPY TO CLIPBOARD =====
window.copyText = function(text, label) {
  navigator.clipboard?.writeText(text).then(() => {
    toast(`📋 ${label || 'Copiado'}!`, 'success', 1800);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(`📋 ${label || 'Copiado'}!`, 'success', 1800);
  });
};

// ===== CONFIRM DELETE =====
window.confirmDelete = function(msg, callback) {
  if (confirm(msg || 'Tem certeza? Esta ação é irreversível.')) callback();
};

// ===== API HELPER =====
window.api = {
  async post(url, data) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || d.message || `HTTP ${r.status}`);
    }
    return r.json().catch(() => ({}));
  },
  async get(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  async delete(url) {
    const r = await fetch(url, { method: 'DELETE' });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || `HTTP ${r.status}`);
    }
    return r.json().catch(() => ({}));
  }
};

// ===== AUTO-REFRESH STATUS =====
document.addEventListener('DOMContentLoaded', () => {
  // Fecha sidebar ao clicar fora em mobile
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !toggle?.contains(e.target)) {
      sidebar.classList.remove('open');
      document.getElementById('sidebarOverlay')?.classList.remove('open');
    }
  });

  // Fecha modal ao clicar fora
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });

  // Fecha modal com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    }
  });

  // Formulários com data-ajax
  document.querySelectorAll('form[data-ajax]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      const orig = btn?.textContent;
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Aguarde...'; }
      try {
        const data = Object.fromEntries(new FormData(form));
        const r = await fetch(form.action, {
          method: form.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok) {
          toast(d.message || '✅ Salvo com sucesso!', 'success');
          if (d.redirect) setTimeout(() => location.href = d.redirect, 1200);
        } else {
          toast(d.error || '❌ Erro ao salvar', 'error');
        }
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = orig; }
      }
    });
  });
});

// ===== FORMATTERS =====
window.formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');
window.formatDateTime = (d) => new Date(d).toLocaleString('pt-BR');
window.formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
