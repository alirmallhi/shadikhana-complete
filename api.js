// ShadiKhana — Frontend to Backend Connector
// This file connects your website to the backend API on Render

var API_BASE = 'https://shadikhana-api.onrender.com/api';

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

// ── Submit Registration to Backend ──
async function submitRegistration() {
  var btn = document.getElementById('submit-btn') ||
            document.querySelector('#reg-step-6 .btn-primary');

  // Collect all form values
  var payload = {
    full_name:           gv('f-fullname'),
    display_name:        gv('f-alias'),
    mobile:              gv('f-mobile'),
    whatsapp:            gv('f-whatsapp'),
    email:               gv('f-email'),
    password:            document.getElementById('f-password') ? document.getElementById('f-password').value : '',
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

  // Basic validation
  if (!payload.full_name || payload.full_name === 'x2014') {
    alert('Please enter your full name.');
    return;
  }
  if (!payload.email) {
    alert('Please enter your email address.');
    return;
  }
  if (!payload.mobile) {
    alert('Please enter your mobile number.');
    return;
  }
  if (!payload.password || payload.password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  // Show loading
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
  }

  try {
    // Save to database
    var result = await apiCall('/auth/register', 'POST', payload);

    if (result.success) {
      // Save token
      localStorage.setItem('sk_token', result.data.token);
      localStorage.setItem('sk_member', JSON.stringify(result.data.member));

      // Handle payment method
      var pm = payload.payment_method;
      if (pm === 'jazzcash' || pm === 'easypaisa') {
        await apiCall('/payment/' + pm, 'POST', {
          payment_type: 'registration',
          mobile_number: payload.mobile
        });
      } else {
        // Bank transfer - submit record
        await apiCall('/payment/bank-transfer', 'POST', {
          payment_type: 'registration',
          sender_name: payload.full_name
        });
        // Also send via WhatsApp as backup
        sendToWhatsApp();
        return;
      }

      // Show success
      if (typeof closeModal === 'function') closeModal('register');
      if (typeof openModal === 'function') openModal('success');

    } else {
      alert('Registration failed: ' + (result.message || 'Please try again.'));
    }

  } catch (err) {
    console.log('Registration error:', err);
    alert('Something went wrong. Please try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Send Profile via WhatsApp';
    }
  }
}

// ── Login ──
async function loginMember(email, password) {
  var result = await apiCall('/auth/login', 'POST', { email: email, password: password });
  if (result.success) {
    localStorage.setItem('sk_token', result.data.token);
    localStorage.setItem('sk_member', JSON.stringify(result.data.member));
    return true;
  }
  return false;
}

// ── Check if logged in ──
function isLoggedIn() {
  return !!localStorage.getItem('sk_token');
}

// ── Get current member ──
function getCurrentMember() {
  var data = localStorage.getItem('sk_member');
  return data ? JSON.parse(data) : null;
}

// ── Logout ──
function logout() {
  localStorage.removeItem('sk_token');
  localStorage.removeItem('sk_member');
  window.location.href = '/';
}

// ── Load profiles from backend ──
async function loadProfiles(filters) {
  var params = new URLSearchParams(filters || {}).toString();
  return await apiCall('/profiles?' + params, 'GET');
}

// ── Send interest ──
async function sendInterest(receiverUuid, message) {
  return await apiCall('/interests/send', 'POST', {
    receiver_uuid: receiverUuid,
    message: message || ''
  });
}

// ── Get notifications ──
async function getNotifications() {
  return await apiCall('/notifications', 'GET');
}

// ── Get payment history ──
async function getPaymentHistory() {
  return await apiCall('/payment/history', 'GET');
}

console.log('ShadiKhana API connector loaded successfully');
