const $ = (id) => document.getElementById(id);

function setStatus(el, msg, type) {
  el.textContent = msg;
  el.className = 'status show ' + (type || '');
}

function clearStatus(el) {
  el.textContent = '';
  el.className = 'status';
}

function setStep(n) {
  $('step1').style.display = (n === 1) ? 'block' : 'none';
  $('step2').style.display = (n === 2) ? 'block' : 'none';
  $('step3').style.display = (n === 3) ? 'block' : 'none';

  $('chip1').classList.toggle('active', n === 1);
  $('chip2').classList.toggle('active', n === 2);
  $('chip3').classList.toggle('active', n === 3);
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('Request failed: ' + res.status));
  return data;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function resetCreateForm() {
  setStep(1);
  clearStatus($('signupStatus'));
  $('signupEmail').value = '';
  $('verifyCode').value = '';
  $('newPassword').value = '';
}

function setCreatePanelVisible(visible) {
  const signInPanel = $('signInPanel');
  const createPanel = $('createPanel');

  signInPanel.style.display = visible ? 'none' : 'block';
  createPanel.style.display = visible ? 'block' : 'none';

  // When returning to sign in, reset create form for cleanliness
  if (!visible) resetCreateForm();

  // Focus
  if (visible) {
    $('signupEmail').focus();
  } else {
    $('loginEmail').focus();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Default state: show sign in only
  setCreatePanelVisible(false);

  // ---------- login ----------
  $('loginBtn').addEventListener('click', async () => {
    clearStatus($('loginStatus'));

    const email = normalizeEmail($('loginEmail').value);
    const password = $('loginPassword').value;

    try {
      await postJSON('/api/auth/login', { email, password });
      window.location.href = '/index.html';
    } catch (e) {
      setStatus($('loginStatus'), e.message, 'error');
    }
  });

  // ---------- open create account ----------
  $('goToCreateBtn')?.addEventListener('click', () => {
    clearStatus($('loginStatus'));
    setCreatePanelVisible(true);
  });

  // ---------- back buttons (create -> sign in) ----------
  $('backToSignInBtn')?.addEventListener('click', () => setCreatePanelVisible(false));
  $('backToSignInBtn2')?.addEventListener('click', () => setCreatePanelVisible(false));
  $('backToSignInBtn3')?.addEventListener('click', () => setCreatePanelVisible(false));

  // ---------- signup steps ----------
  let pendingEmail = null;

  $('sendCodeBtn').addEventListener('click', async () => {
    clearStatus($('signupStatus'));

    const email = normalizeEmail($('signupEmail').value);
    if (!email.endsWith('@up.edu')) {
      return setStatus($('signupStatus'), 'Please use your @up.edu email.', 'error');
    }

    try {
      await postJSON('/api/auth/signup', { email });
      pendingEmail = email;
      setStep(2);
      setStatus($('signupStatus'), 'Verification code sent. Check your email.', 'ok');
      $('verifyCode').focus();
    } catch (e) {
      setStatus($('signupStatus'), e.message, 'error');
    }
  });

  $('resendBtn')?.addEventListener('click', async () => {
    if (!pendingEmail) return;

    clearStatus($('signupStatus'));
    try {
      await postJSON('/api/auth/signup', { email: pendingEmail });
      setStatus($('signupStatus'), 'Verification code resent.', 'ok');
    } catch (e) {
      setStatus($('signupStatus'), e.message, 'error');
    }
  });

  $('verifyBtn').addEventListener('click', async () => {
    clearStatus($('signupStatus'));

    const code = String($('verifyCode').value || '').trim();
    if (!pendingEmail) return setStatus($('signupStatus'), 'Enter your email first.', 'error');
    if (code.length < 4) return setStatus($('signupStatus'), 'Enter the code from your email.', 'error');

    try {
      await postJSON('/api/auth/verify', { email: pendingEmail, code });
      setStep(3);
      setStatus($('signupStatus'), 'Email verified. Create a password.', 'ok');
      $('newPassword').focus();
    } catch (e) {
      setStatus($('signupStatus'), e.message, 'error');
    }
  });

  $('setPasswordBtn').addEventListener('click', async () => {
    clearStatus($('signupStatus'));

    const password = $('newPassword').value;
    if (!pendingEmail) return setStatus($('signupStatus'), 'Enter your email first.', 'error');
    if (password.length < 8) return setStatus($('signupStatus'), 'Password must be at least 8 characters.', 'error');

    try {
      await postJSON('/api/auth/set-password', { email: pendingEmail, password });
      window.location.href = '/index.html';
    } catch (e) {
      setStatus($('signupStatus'), e.message, 'error');
    }
  });
});
