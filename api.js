// api.js — ShadiKhana Frontend ↔ Backend connector
// Add to your HTML: <script src="/api.js"></script>
// Or host on Vercel and reference: <script src="https://shadikhana.vercel.app/api.js"></script>

// ── CONFIG: Update this to your Render URL after deployment ──
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'                        // Local development
  : 'https://shadikhana-api.onrender.com/api';         // Production (your Render URL)

// ════════════════════════════════════════════
//  CORE API HELPER
// ════════════════════════════════════════════
async function apiCall(endpoint, method = 'GET', body = null, isAdmin = false) {
  const tokenKey = isAdmin ? 'sk_admin_token' : 'sk_token';
  const token    = localStorage.getItem(tokenKey);

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    // Let browser set multipart boundary automatically
    opts.body = body;
  }

  const res  = await fetch(`${API_BASE}${endpoint}`, opts);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

// ════════════════════════════════════════════
//  FORM HELPERS
// ════════════════════════════════════════════
function gv(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  return (el.value || '').trim();
}

function getSelectedTab() {
  const active = document.querySelector('.tabs .tab-btn.active');
  if (!active) return 'self_male';
  const text = active.textContent.toLowerCase();
  if (text.includes('man'))      return 'self_male';
  if (text.includes('woman'))    return 'self_female';
  if (text.includes('son'))      return 'son';
  if (text.includes('daughter')) return 'daughter';
  return 'self_male';
}

function showFormError(msg) {
  let el = document.getElementById('form-error-msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'form-error-msg';
    el.style.cssText = 'background:#FDE8EF;border-radius:10px;padding:.8rem 1rem;' +
                       'color:#B0002F;font-size:.84rem;margin-bottom:1rem;font-weight:500;';
    const step6 = document.getElementById('reg-step-6');
    if (step6) step6.insertBefore(el, step6.firstChild);
  }
  el.textContent = '⚠️ ' + msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ════════════════════════════════════════════
//  REGISTRATION — saves to database via API
// ════════════════════════════════════════════
async function submitRegistration() {
  const btn = document.querySelector('#reg-step-6 .btn-primary');

  const payload = {
    // Step 1 — Account
    full_name:           gv('f-fullname'),
    display_name:        gv('f-alias'),
    mobile:              gv('f-mobile'),
    whatsapp:            gv('f-whatsapp'),
    email:               gv('f-email'),
    password:            document.getElementById('f-password')?.value || '',
    profile_for:         getSelectedTab(),

    // Step 2 — Personal
    gender:              gv('f-gender'),
    date_of_birth:       gv('f-dob'),
    marital_status:      gv('f-marital'),
    children:            gv('f-children'),
    height:              gv('f-height'),
    weight:              gv('f-weight'),
    complexion:          gv('f-complexion'),
    body_type:           gv('f-bodytype'),

    // Step 3 — Background
    religion:            gv('f-religion'),
    sect:                gv('f-sect'),
    ethnicity:           gv('f-ethnicity'),
    caste:               gv('f-caste'),
    piety_level:         gv('f-piety'),
    education:           gv('f-education'),
    study_field:         gv('f-studyfield'),
    institution:         gv('f-institution'),

    // Step 4 — Lifestyle
    employment_status:   gv('f-employment'),
    profession:          gv('f-profession'),
    monthly_income:      gv('f-income'),
    employer:            gv('f-employer'),
    country:             gv('f-country'),
    city:                gv('f-city'),
    area:                gv('f-area'),
    residence_status:    gv('f-residencestatus'),
    house_size:          gv('f-housesize'),
    family_arrangement:  gv('f-familytype'),
    partner_age_min:     gv('f-partnerage-min'),
    partner_age_max:     gv('f-partnerage-max'),
    partner_city:        gv('f-partnercity'),
    partner_education:   gv('f-partneredu'),
    partner_divorced_ok: gv('f-partnerdivorced'),
    about_me:            gv('f-aboutme'),
    family_description:  gv('f-familydesc'),

    // Parents
    father_name:         gv('f-fathername'),
    father_occupation:   gv('f-fatherjob'),
    father_employer:     gv('f-fatheremployer'),
    mother_name:         gv('f-mothername'),
    mother_occupation:   gv('f-motherjob'),
    mother_employer:     gv('f-motheremployer'),
    parents_status:      gv('f-parentsstatus'),
    siblings_count:      gv('f-siblings'),

    // Step 5 — Package
    package: selectedPlan || 'basic',

    // Contact Preference (Step 4)
    contact_preference: document.getElementById('f-contact-direct')?.checked ? 'direct' : 'via_us',
    contact_method:     document.getElementById('f-contact-method')?.value  || 'both',
    contact_hours:      document.getElementById('f-contact-hours')?.value   || 'anytime',
    contact_note:       document.getElementById('f-contact-note')?.value    || '',

    // Step 6 — Payment
    payment_method: document.getElementById('payment-method')?.value || 'bank_transfer',
  };

  // Client-side validation
  if (!payload.full_name)      return showFormError('Full name is required (Step 1).');
  if (!payload.email)          return showFormError('Email address is required (Step 1).');
  if (!payload.mobile)         return showFormError('Mobile number is required (Step 1).');
  if (!payload.password || payload.password.length < 6)
                               return showFormError('Password must be at least 6 characters (Step 1).');
  if (!payload.gender || payload.gender === 'Select Gender')
                               return showFormError('Please select your gender (Step 2).');

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Submitting...'; }

  try {
    // ── Save to database ──
    const result = await apiCall('/auth/register', 'POST', payload);

    // Store token and member data
    localStorage.setItem('sk_token',  result.data.token);
    localStorage.setItem('sk_member', JSON.stringify(result.data.member));

    // ── Initiate payment based on method ──
    const pm = payload.payment_method;
    if (pm === 'jazzcash') {
      await apiCall('/payment/jazzcash', 'POST', {
        payment_type:  'registration',
        mobile_number: payload.mobile,
      });
    } else if (pm === 'easypaisa') {
      await apiCall('/payment/easypaisa', 'POST', {
        payment_type:  'registration',
        mobile_number: payload.mobile,
      });
    } else {
      // Bank transfer — submit record + notify admin via WhatsApp
      await apiCall('/payment/bank-transfer', 'POST', {
        payment_type: 'registration',
        sender_name:  payload.full_name,
      });
      // Also open WhatsApp with profile summary as backup
      sendToWhatsApp();
      return; // sendToWhatsApp handles modal transition
    }

    closeModal('register');
    openModal('success');

  } catch (err) {
    showFormError(err.message || 'Registration failed. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '📱 Send Profile via WhatsApp →'; }
  }
}

// ════════════════════════════════════════════
//  PHOTO UPLOAD (to Cloudinary via API)
// ════════════════════════════════════════════
async function uploadProfilePhoto(fileInput) {
  if (!fileInput.files || !fileInput.files[0]) return;

  const formData = new FormData();
  formData.append('photo', fileInput.files[0]);

  try {
    const result = await apiCall('/member/photo', 'POST', formData);
    // Show preview
    const preview = document.getElementById('photo-preview');
    if (preview && result.data?.photo_url) {
      preview.src   = result.data.photo_url;
      preview.style.display = 'block';
    }
    alert('✅ Photo uploaded successfully!');
  } catch (err) {
    alert('Photo upload failed: ' + err.message);
  }
}

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════
async function submitLogin(email, password, isAdmin = false) {
  try {
    const endpoint = isAdmin ? '/admin/login' : '/auth/login';
    const result   = await apiCall(endpoint, 'POST', { email, password }, isAdmin);

    if (isAdmin) {
      localStorage.setItem('sk_admin_token', result.data.token);
      localStorage.setItem('sk_admin',       JSON.stringify(result.data.admin));
      window.location.href = '/admin/';
    } else {
      localStorage.setItem('sk_token',  result.data.token);
      localStorage.setItem('sk_member', JSON.stringify(result.data.member));
      closeModal('login');
      openModal('success');
    }
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
}

function logout(isAdmin = false) {
  localStorage.removeItem(isAdmin ? 'sk_admin_token' : 'sk_token');
  localStorage.removeItem(isAdmin ? 'sk_admin'       : 'sk_member');
  window.location.href = '/';
}

// ════════════════════════════════════════════
//  PROFILES
// ════════════════════════════════════════════
async function loadProfiles(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return await apiCall(`/profiles?${params}`);
}

async function viewProfile(uuid) {
  return await apiCall(`/profiles/${uuid}`);
}

// ════════════════════════════════════════════
//  INTERESTS
// ════════════════════════════════════════════
async function sendInterest(receiverUuid, message = '') {
  return await apiCall('/interests/send', 'POST', { receiver_uuid: receiverUuid, message });
}

async function respondInterest(interestId, action) {
  return await apiCall('/interests/respond', 'POST', { interest_id: interestId, action });
}

async function getMyInterests() {
  return await apiCall('/interests');
}

// ════════════════════════════════════════════
//  MESSAGES
// ════════════════════════════════════════════
async function sendMessage(receiverUuid, content) {
  return await apiCall('/messages/send', 'POST', { receiver_uuid: receiverUuid, content });
}

async function getConversations() {
  return await apiCall('/messages');
}

async function getMessages(memberUuid) {
  return await apiCall(`/messages/${memberUuid}`);
}

// ════════════════════════════════════════════
//  PAYMENTS
// ════════════════════════════════════════════
async function getPaymentHistory() {
  return await apiCall('/payment/history');
}

// ════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════
function isLoggedIn()      { return !!localStorage.getItem('sk_token'); }
function isAdminLoggedIn() { return !!localStorage.getItem('sk_admin_token'); }
function getCurrentMember() {
  const d = localStorage.getItem('sk_member');
  return d ? JSON.parse(d) : null;
}
