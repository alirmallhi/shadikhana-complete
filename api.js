// ShadiKhana — Frontend to Backend Connector
// This file connects your website to the backend API on Render

var API_BASE = 'https://shadikhana-api.onrender.com/api';
var WA_NUMBER = '923214133233';

// ── Make API calls ──
async function apiCall(endpoint, method, body) {
  var token = localStorage.getItem('sk_token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  var opts = { method: method || 'GET', headers: headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    var res  = await fetch(API_BASE + endpoint, opts);
    var data = await res.json();
    return data;
  } catch (err) {
    console.log('API error:', err);
    return { success: false, message: 'Connection error' };
  }
}

function gv(id) {
  var el = document.getElementById(id);
  return el ? (el.value || '').trim() : '';
}

// ── Automatically open WhatsApp in background with profile summary ──
// Called right after a successful database save — no extra click needed
function autoNotifyWhatsApp(payload) {
  var msg =
    'SHADIKHANA - NEW PROFILE REGISTRATION\n' +
    '========================================\n' +
    'Name: '             + (payload.full_name || '-')   + '\n' +
    'Gender: '           + (payload.gender || '-')       + '\n' +
    'City: '             + (payload.city || '-')         + '\n' +
    'Mobile: '           + (payload.mobile || '-')       + '\n' +
    'Email: '            + (payload.email || '-')        + '\n' +
    'Sect: '             + (payload.sect || '-')          + '\n' +
    'Caste: '            + (payload.caste || '-')         + '\n' +
    'Education: '        + (payload.education || '-')     + '\n' +
    'Profession: '       + (payload.profession || '-')    + '\n' +
    'Marital Status: '   + (payload.marital_status || '-')+ '\n' +
    'Height: '           + (payload.height || '-')        + '\n' +
    "Father's Job: "     + (payload.father_occupation || '-') + '\n' +
    "Mother's Job: "     + (payload.mother_occupation || '-') + '\n' +
    'Contact Pref: '     + (payload.contact_preference === 'direct' ? 'Direct Contact Allowed' : 'Via ShadiKhana Only') + '\n' +
    '----------------------------------------\n' +
    'Package: ' + (payload.package || '-') + '\n' +
    'Payment Method: ' + (payload.payment_method || '-') + '\n' +
    '========================================\n' +
    'Submitted automatically from shadikhana.pk';

  var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);

  // Open in a new background tab — does not interrupt the user's flow
  var waWindow = window.open(url, '_blank');

  if (!waWindow) {
    console.log('WhatsApp auto-notification popup was blocked by the browser. Registration was still saved successfully.');
  }
}

// ── Submit Registration to Backend ──
async function submitRegistration() {
  var btn = document.getElementById('submit-btn') ||
            document.querySelector('#reg-step-6 .btn-primary');

  var payload = {
    full_name:           gv('f-fullname'),
    display_name:        gv('f-alias'),
    mobile:              gv('f-mobile'),
    whatsapp:            gv('f-whatsapp'),
    email:               gv('f-email'),
    password:            document.getElementById('f-password') ? document.getElementById('f-password').value : '',
    profile_for:         (typeof selectedProfileFor !== 'undefined' ? selectedProfileFor : 'self_male'),
    guardian_name:       gv('f-guardianname'),
    guardian_declaration: document.getElementById('f-guardian-declaration') ? document.getElementById('f-guardian-declaration').checked : false,
    gender:              gv('f-gender'),
    date_of_birth:       gv('f-dob'),
    marital_status:      gv('f-marital'),
    children:            gv('f-children'),
    height:              gv('f-height'),
    weight:              gv('f-weight'),
    complexion:          gv('f-complexion'),
    body_type:           gv('f-bodytype'),
    religion:            gv('f-religion'),
    sect:                gv('f-sect'),
    ethnicity:           gv('f-ethnicity'),
    caste:               gv('f-caste'),
    piety_level:         gv('f-piety'),
    education:           gv('f-education'),
    study_field:         gv('f-studyfield'),
    institution:         gv('f-institution'),
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
    father_name:         gv('f-fathername'),
    father_occupation:   gv('f-fatherjob'),
    father_employer:     gv('f-fatheremployer'),
    mother_name:         gv('f-mothername'),
    mother_occupation:   gv('f-motherjob'),
    mother_employer:     gv('f-motheremployer'),
    parents_status:      gv('f-parentsstatus'),
    siblings_count:      gv('f-siblings'),
    package:             selectedPlan || 'basic',
    payment_method:      gv('payment-method') || 'bank_transfer',
    privacy_preset:      document.getElementById('f-privacy-preset') ? document.getElementById('f-privacy-preset').value : 'open',
    priv_photo:          document.getElementById('priv-photo') ? document.getElementById('priv-photo').checked : false,
    priv_contact:        document.getElementById('priv-contact') ? document.getElementById('priv-contact').checked : false,
    priv_family:         document.getElementById('priv-family') ? document.getElementById('priv-family').checked : false,
    priv_income:         document.getElementById('priv-income') ? document.getElementById('priv-income').checked : false,
    priv_location:       document.getElementById('priv-location') ? document.getElementById('priv-location').checked : false,
    priv_name:           document.getElementById('priv-name') ? document.getElementById('priv-name').checked : false,
    priv_marital:        document.getElementById('priv-marital') ? document.getElementById('priv-marital').checked : false,
    contact_preference:  document.getElementById('f-contact-direct') && document.getElementById('f-contact-direct').checked ? 'direct' : 'via_us',
    contact_method:      gv('f-contact-method') || 'both',
    contact_hours:       gv('f-contact-hours') || 'anytime',
    contact_note:        gv('f-contact-note') || ''
  };

  // Validation
  if (!payload.full_name) { alert('Please enter your full name.'); return; }
  if (!payload.email)     { alert('Please enter your email address.'); return; }
  if (!payload.mobile)    { alert('Please enter your mobile number.'); return; }
  if (!payload.password || payload.password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }
  if (!payload.guardian_declaration) {
    alert('Please confirm the registration declaration before continuing.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
  }

  try {
    var result = await apiCall('/auth/register', 'POST', payload);

    if (result.success) {
      localStorage.setItem('sk_token', result.data.token);
      localStorage.setItem('sk_member', JSON.stringify(result.data.member));

      // If a photo was selected during registration, upload it now that we
      // have a real member account/token to attach it to
      if (typeof selectedRegPhoto !== 'undefined' && selectedRegPhoto) {
        try {
          var photoForm = new FormData();
          photoForm.append('photo', selectedRegPhoto);
          await fetch(API_BASE + '/member/photo', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + result.data.token },
            body: photoForm
          });
        } catch (photoErr) {
          console.error('Registration photo upload error (non-fatal):', photoErr);
          // Registration itself already succeeded — don't block on this.
          // The member can always add/change their photo later from the dashboard.
        }
      }

      // Automatically notify WhatsApp in the background — no extra click
      autoNotifyWhatsApp(payload);

      // Record a pending payment entry — actual confirmation happens manually
      // once admin verifies the payment screenshot sent via WhatsApp/email
      await apiCall('/payment/bank-transfer', 'POST', {
        payment_type: 'registration',
        sender_name: payload.full_name
      });

      if (typeof closeModal === 'function') closeModal('register');
      if (typeof openModal === 'function') openModal('success');

      // Fill in the real mobile number and package on the success screen
      var mobileDisplay = document.getElementById('success-mobile-display');
      if (mobileDisplay) {
        mobileDisplay.textContent = payload.mobile || 'your registered number';
      }
      var pkgDisplay = document.getElementById('success-package-display');
      if (pkgDisplay) {
        var pkgAmounts = { basic: '10,000', premium: '40,000' };
        pkgDisplay.textContent = 'PKR ' + (pkgAmounts[payload.package] || '10,000');
      }

    } else {
      alert('Registration failed: ' + (result.message || 'Please try again.'));
    }

  } catch (err) {
    console.log('Registration error:', err);
    alert('Something went wrong. Please try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Submit';
    }
  }
}

// ── Login ──
async function loginMember(email, password) {
  var result = await apiCall('/auth/login', 'POST', { email: email, password: password });
  if (result.success) {
    localStorage.setItem('sk_token', result.data.token);
    localStorage.setItem('sk_member', JSON.stringify(result.data.member));
    return result;
  }
  return result;
}

// ── Handle Sign In button click ──
async function handleLogin() {
  var emailEl    = document.getElementById('login-email');
  var passwordEl = document.getElementById('login-password');
  var errorEl    = document.getElementById('login-error');
  var btn        = document.getElementById('login-btn');

  var email    = emailEl    ? emailEl.value.trim()    : '';
  var password = passwordEl ? passwordEl.value.trim() : '';

  if (errorEl) errorEl.style.display = 'none';

  if (!email) {
    if (errorEl) { errorEl.textContent = 'Please enter your email or mobile number.'; errorEl.style.display = 'block'; }
    return;
  }
  if (!password) {
    if (errorEl) { errorEl.textContent = 'Please enter your password.'; errorEl.style.display = 'block'; }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }

  try {
    var result = await loginMember(email, password);

    if (result.success) {
      // Logged in successfully — redirect straight to dashboard
      window.location.href = '/dashboard.html';
    } else {
      if (errorEl) {
        errorEl.textContent = result.message || 'Invalid email or password. Please try again.';
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    console.log('Login error:', err);
    if (errorEl) {
      errorEl.textContent = 'Something went wrong. Please try again.';
      errorEl.style.display = 'block';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
  }
}

function isLoggedIn() {
  return !!localStorage.getItem('sk_token');
}

function getCurrentMember() {
  var data = localStorage.getItem('sk_member');
  return data ? JSON.parse(data) : null;
}

function logout() {
  localStorage.removeItem('sk_token');
  localStorage.removeItem('sk_member');
  window.location.href = '/';
}

async function loadProfiles(filters) {
  var params = new URLSearchParams(filters || {}).toString();
  return await apiCall('/profiles?' + params, 'GET');
}

async function sendInterest(receiverUuid, message) {
  return await apiCall('/interests/send', 'POST', {
    receiver_uuid: receiverUuid,
    message: message || ''
  });
}

async function getNotifications() {
  return await apiCall('/notifications', 'GET');
}

async function getPaymentHistory() {
  return await apiCall('/payment/history', 'GET');
}

console.log('ShadiKhana API connector loaded successfully');
