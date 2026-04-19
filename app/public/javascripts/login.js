function setStatus(el, msg, ok = false) {
  if (!el) return;
  el.textContent = msg || '';
  el.style.color = ok ? '#0a7a2f' : '#b00020';
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function showOnlyPanel(panelId) {
  const panels = ['signInPanel', 'createPanel', 'resetPanel'];
  for (const id of panels) {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === panelId) ? '' : 'none';
  }
}

function setChipActive(prefix, idx) {
  // prefix: '' (signup chips) or 'reset'
  const ids = prefix
    ? [`${prefix}Chip1`, `${prefix}Chip2`, `${prefix}Chip3`]
    : ['chip1', 'chip2', 'chip3'];

  ids.forEach((id, i) => {
    const chip = document.getElementById(id);
    if (!chip) return;
    chip.classList.toggle('active', i === (idx - 1));
  });
}

/* --------------------------
   SIGN IN
-------------------------- */
async function handleLogin() {
  const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
  const password = document.getElementById('loginPassword')?.value || '';
  const status = document.getElementById('loginStatus');
  setStatus(status, '');

  try {
    const data = await postJson('/api/auth/login', { email, password });
    if (data.ok) {
      window.location.href = '/index.html';
      return;
    }
    setStatus(status, data.error || 'Login failed.');
  } catch (e) {
    setStatus(status, e.message || 'Login failed.');
  }
}

/* --------------------------
   SIGN UP (your existing 3-step flow)
-------------------------- */
async function handleSendSignupCode() {
  const email = (document.getElementById('signupEmail')?.value || '').trim().toLowerCase();
  const status = document.getElementById('signupStatus');
  setStatus(status, '');

  try {
    await postJson('/api/auth/signup', { email });
    setStatus(status, 'Verification code sent (if eligible).', true);

    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = '';
    document.getElementById('step3').style.display = 'none';
    setChipActive('', 2);
  } catch (e) {
    setStatus(status, e.message || 'Signup failed.');
  }
}

async function handleVerifySignupCode() {
  const email = (document.getElementById('signupEmail')?.value || '').trim().toLowerCase();
  const code = (document.getElementById('verifyCode')?.value || '').trim();
  const status = document.getElementById('signupStatus');
  setStatus(status, '');

  try {
    await postJson('/api/auth/verify', { email, code });
    setStatus(status, 'Email verified. Now set a password.', true);

    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = '';
    setChipActive('', 3);
  } catch (e) {
    setStatus(status, e.message || 'Verification failed.');
  }
}

async function handleSetPassword() {
  const email = (document.getElementById('signupEmail')?.value || '').trim().toLowerCase();
  const password = document.getElementById('newPassword')?.value || '';
  const status = document.getElementById('signupStatus');
  setStatus(status, '');

  try {
    const data = await postJson('/api/auth/set-password', { email, password });
    if (data.ok) {
      window.location.href = '/index.html';
      return;
    }
    setStatus(status, data.error || 'Set password failed.');
  } catch (e) {
    setStatus(status, e.message || 'Set password failed.');
  }
}

/* --------------------------
   RESET PASSWORD (new 3-step flow)
-------------------------- */
async function handleSendResetCode() {
  const email = (document.getElementById('resetEmail')?.value || '').trim().toLowerCase();
  const status = document.getElementById('resetStatus');
  setStatus(status, '');

  try {
    await postJson('/api/auth/request-password-reset', { email });
    setStatus(status, 'If that email exists, a reset code was sent.', true);

    document.getElementById('resetStep1').style.display = 'none';
    document.getElementById('resetStep2').style.display = '';
    document.getElementById('resetStep3').style.display = 'none';
    setChipActive('reset', 2);
  } catch (e) {
    setStatus(status, e.message || 'Failed to send reset code.');
  }
}

function handleResetContinueToPassword() {
  const code = (document.getElementById('resetCode')?.value || '').trim();
  const status = document.getElementById('resetStatus');
  setStatus(status, '');

  if (!code) {
    setStatus(status, 'Enter the 6-digit reset code.');
    return;
  }

  document.getElementById('resetStep1').style.display = 'none';
  document.getElementById('resetStep2').style.display = 'none';
  document.getElementById('resetStep3').style.display = '';
  setChipActive('reset', 3);
}

async function handleConfirmReset() {
  const email = (document.getElementById('resetEmail')?.value || '').trim().toLowerCase();
  const code = (document.getElementById('resetCode')?.value || '').trim();
  const newPassword = document.getElementById('resetNewPassword')?.value || '';
  const status = document.getElementById('resetStatus');
  setStatus(status, '');

  try {
    const data = await postJson('/api/auth/confirm-password-reset', { email, code, newPassword });
    if (data.ok) {
      setStatus(status, 'Password updated. Redirecting...', true);
      setTimeout(() => (window.location.href = '/index.html'), 600);
      return;
    }
    setStatus(status, data.error || 'Password reset failed.');
  } catch (e) {
    setStatus(status, e.message || 'Password reset failed.');
  }
}

/* --------------------------
   NAV / WIRING
-------------------------- */
function goToCreate() {
  showOnlyPanel('createPanel');
  setChipActive('', 1);
  document.getElementById('step1').style.display = '';
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'none';
  setStatus(document.getElementById('signupStatus'), '');
}

function goToSignIn() {
  showOnlyPanel('signInPanel');
  setStatus(document.getElementById('loginStatus'), '');
}

function goToReset() {
  showOnlyPanel('resetPanel');
  setChipActive('reset', 1);
  document.getElementById('resetStep1').style.display = '';
  document.getElementById('resetStep2').style.display = 'none';
  document.getElementById('resetStep3').style.display = 'none';
  setStatus(document.getElementById('resetStatus'), '');

  // Prefill from login
  const loginEmail = (document.getElementById('loginEmail')?.value || '').trim();
  if (loginEmail) document.getElementById('resetEmail').value = loginEmail;
}

document.addEventListener('DOMContentLoaded', () => {
  // Sign in
  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('goToCreateBtn')?.addEventListener('click', goToCreate);
  document.getElementById('goToResetBtn')?.addEventListener('click', goToReset);

  // Create flow
  document.getElementById('sendCodeBtn')?.addEventListener('click', handleSendSignupCode);
  document.getElementById('verifyBtn')?.addEventListener('click', handleVerifySignupCode);
  document.getElementById('setPasswordBtn')?.addEventListener('click', handleSetPassword);

  document.getElementById('resendBtn')?.addEventListener('click', handleSendSignupCode);

  document.getElementById('backToSignInBtn')?.addEventListener('click', goToSignIn);
  document.getElementById('backToSignInBtn2')?.addEventListener('click', goToSignIn);
  document.getElementById('backToSignInBtn3')?.addEventListener('click', goToSignIn);

  // Reset flow
  document.getElementById('sendResetCodeBtn')?.addEventListener('click', handleSendResetCode);
  document.getElementById('resendResetBtn')?.addEventListener('click', handleSendResetCode);
  document.getElementById('goToResetPasswordStepBtn')?.addEventListener('click', handleResetContinueToPassword);
  document.getElementById('confirmResetBtn')?.addEventListener('click', handleConfirmReset);

  document.getElementById('backToSignInFromReset1')?.addEventListener('click', goToSignIn);
  document.getElementById('backToSignInFromReset2')?.addEventListener('click', goToSignIn);
  document.getElementById('backToSignInFromReset3')?.addEventListener('click', goToSignIn);
});
