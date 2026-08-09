// ShadiKhana — Frontend to Backend Connector
// This file connects your website to the backend API on Render

var API_BASE = 'https://shadikhana-api.onrender.com/api';
var WA_NUMBER = '923105786268';

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
    data.httpStatus = res.status;
    return data;
  } catch (err) {
    console.log('API error:', err);
    return { success: false, message: 'Connection error' };
  }
}

// ── Active pricing campaign ──
// Fetched once on page load (index.html only) and applied to every known
// pricing display on the page — homepage cards, registration modal,
// confirmation screen — from this one place, so a campaign takes effect
// everywhere at once instead of each display needing its own fetch/logic.
// window.activePromotion stays null if there's no campaign running right
// now; every caller below already treats null as "show normal pricing."
async function loadActivePromotion() {
  try {
    var result = await apiCall('/public/active-promotion', 'GET');
    window.activePromotion = (result.success && result.data) ? result.data : null;
  } catch (err) {
    window.activePromotion = null;
  }
  applyActivePromotionToPage();
}

function formatPKR(n) {
  return 'PKR ' + Number(n).toLocaleString();
}

// The banner/pill now carries a simple headline only — no price math
// crammed into it. `short` is for the compact package-select pill, which
// doesn't have room for the full phrase.
function promoBadgeText(short) {
  return short ? '🎉 Offer' : '🎉 Limited-Time Offer';
}

// Struck-through original price immediately followed by the new
// discounted/free price — this is where the "you're saving money" moment
// actually happens now, on the package's own price display, not buried in
// the banner. Returns null (caller leaves the element's original static
// text alone) when there's no active campaign.
function promoPriceHtml(pkg) {
  var promo = window.activePromotion;
  if (!promo) return null;
  var price = pkg === 'premium' ? promo.premium_price : promo.basic_price;
  var original = pkg === 'premium' ? 35000 : 10000;
  var priceLabel = price === 0 ? 'FREE' : formatPKR(price);
  return '<span class="promo-price-original">' + formatPKR(original) + '</span>' + priceLabel;
}

// Full-width banner overlaid on a pricing card — also toggles has-promo on
// the parent card, which adds headroom so the (now much bigger) banner
// never overlaps the card's own icon/badge underneath it.
function applyCardBanner(elId) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = window.activePromotion ? promoBadgeText() : '';
  if (el.parentElement) el.parentElement.classList.toggle('has-promo', !!window.activePromotion);
}

function applyInlineBadge(elId) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = window.activePromotion ? promoBadgeText(true) : '';
}

function applyPromoPrice(elId, pkg) {
  var el = document.getElementById(elId);
  if (!el) return;
  var html = promoPriceHtml(pkg);
  if (html !== null) el.innerHTML = html;
}

function applyActivePromotionToPage() {
  var promo = window.activePromotion;

  // "Choose Your Path" pricing cards (index.html) / comparison cards
  // (package-details.html) — same ids used on both since only one page is
  // ever loaded at once.
  applyCardBanner('promo-badge-basic');
  applyCardBanner('promo-badge-premium');
  applyPromoPrice('plan-price-basic', 'basic');
  applyPromoPrice('plan-price-premium', 'premium');
  applyPromoPrice('pd-price-basic', 'basic');
  applyPromoPrice('pd-price-premium', 'premium');
  updateRegisterButtonPrice('reg-btn-basic', 'basic');
  updateRegisterButtonPrice('reg-btn-premium', 'premium');

  // Registration modal — package-select step (compact inline variant)
  applyInlineBadge('promo-badge-psc-basic');
  applyInlineBadge('promo-badge-psc-premium');
  applyPromoPrice('psc-price-basic', 'basic');
  applyPromoPrice('psc-price-premium', 'premium');

  // Premium Showcase CTA strip
  var showcaseNote = document.getElementById('promo-showcase-note');
  if (showcaseNote) {
    if (promo) {
      showcaseNote.style.display = 'inline-block';
      showcaseNote.textContent = promoBadgeText();
    } else {
      showcaseNote.style.display = 'none';
    }
  }
  applyPromoPrice('showcase-price', 'premium');

  // "Total if matched" (registration + success fee) — the discount itself
  // is already shown via the badges above; this just keeps the combined
  // total from being stale/wrong next to them while a campaign is active.
  // Success fee is never discounted, so only the registration half of the
  // total changes.
  updateTotalIfMatched('plan-total-basic', 'basic', 65000);
  updateTotalIfMatched('plan-total-premium', 'premium', 125000);
  updateTotalIfMatched('psc-total-basic', 'basic', 65000);
  updateTotalIfMatched('psc-total-premium', 'premium', 125000);
  updateTotalIfMatched('pd-total-basic', 'basic', 65000);
  updateTotalIfMatched('pd-total-premium', 'premium', 125000);
}

function effectiveRegPrice(pkg) {
  var promo = window.activePromotion;
  if (!promo) return pkg === 'premium' ? 35000 : 10000;
  return pkg === 'premium' ? promo.premium_price : promo.basic_price;
}

// Swaps just the "Total if matched: PKR X" figure inside whatever markup
// already surrounds it, rather than rebuilding the whole element — works
// unchanged if the source text is added to or reworded later, and leaves
// the element completely untouched (falls back to the correct static
// figure already in the HTML) when no campaign is active.
function updateTotalIfMatched(elId, pkg, successFee) {
  var el = document.getElementById(elId);
  if (!el || !window.activePromotion) return;
  var total = effectiveRegPrice(pkg) + successFee;
  el.innerHTML = el.innerHTML.replace(/Total if matched: PKR [\d,]+/, 'Total if matched: ' + formatPKR(total));
}

// Swaps just the trailing "PKR X" price in a "Register – Basic · PKR 10,000"
// style button/link, leaving the rest of the label (and the static fallback
// price when no campaign is active) untouched.
function updateRegisterButtonPrice(elId, pkg) {
  var el = document.getElementById(elId);
  if (!el || !window.activePromotion) return;
  var price = effectiveRegPrice(pkg);
  var priceLabel = price === 0 ? 'FREE' : formatPKR(price);
  el.textContent = el.textContent.replace(/PKR [\d,]+$/, priceLabel);
}

function gv(id) {
  var el = document.getElementById(id);
  return el ? (el.value || '').trim() : '';
}

// Live-format a CNIC as it's typed: #####-#######-#, capped at 13 digits.
// Shared by the registration form (index.html) and profile edit (dashboard.html).
function formatCnicInput(el) {
  var digits = el.value.replace(/\D/g, '').slice(0, 13);
  var formatted = digits;
  if (digits.length > 5)  formatted = digits.slice(0, 5) + '-' + digits.slice(5);
  if (digits.length > 12) formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
  el.value = formatted;
}

// ── Build the pre-filled profile summary shared by the auto-popup below
// and the visible "Send Payment Screenshot" button on the success screen ──
function buildWhatsAppRegistrationMessage(payload) {
  return (
    'RISHTA SQUARE - NEW PROFILE REGISTRATION\n' +
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
    '----------------------------------------\n' +
    'Package: ' + (payload.package || '-') + '\n' +
    'Payment Method: ' + (payload.payment_method || '-') + '\n' +
    '========================================\n' +
    'Submitted automatically from rishtasquare.com'
  );
}

// ── Automatically open WhatsApp in background with profile summary ──
// Called right after a successful database save — no extra click needed.
// Best-effort only: this runs after an awaited fetch, outside the direct
// user-gesture chain, so browsers frequently block the popup silently. The
// visible button on the success screen (wired in submitRegistration below)
// carries the same message and is a real click, so it's the reliable path —
// this is just a bonus if the browser happens to allow it.
function autoNotifyWhatsApp(payload) {
  var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildWhatsAppRegistrationMessage(payload));

  var waWindow = window.open(url, '_blank');

  if (!waWindow) {
    console.log('WhatsApp auto-notification popup was blocked by the browser. Registration was still saved successfully.');
  }
}

// ── Submit Registration to Backend ──
async function submitRegistration() {
  var btn = document.getElementById('submit-btn') ||
            document.querySelector('#reg-step-6 .btn-primary');

  // Profession is a controlled dropdown with an "Other" free-text reveal
  // (RS_PROFESSION) — send the actual specified text, not the literal
  // word "Other". City is a Pakistan-only dropdown — free text for every
  // other country (see updateCityFieldForCountry). This is the payload
  // that actually reaches the backend and autoNotifyWhatsApp below, unlike
  // sendToWhatsApp() in index.html, which builds a similarly-named but
  // entirely unused message (no button calls it) — don't confuse the two.
  var resolvedProfession = gv('f-profession') === 'Other' ? gv('f-profession-other') : gv('f-profession');
  var resolvedCity = gv('f-country') === 'Pakistan' ? gv('f-city') : gv('f-city-other');
  // Caste is a controlled dropdown with an "Other" free-text reveal too
  // (RS_CASTE) — same reasoning as profession above.
  var resolvedCaste = gv('f-caste') === 'Other' ? gv('f-caste-other') : gv('f-caste');

  var payload = {
    full_name:           gv('f-fullname'),
    display_name:        gv('f-alias'),
    mobile:              gv('f-mobile'),
    whatsapp:            gv('f-whatsapp'),
    cnic:                gv('f-cnic'),
    email:               gv('f-email'),
    password:            document.getElementById('f-password') ? document.getElementById('f-password').value : '',
    profile_for:         (typeof selectedProfileFor !== 'undefined' ? selectedProfileFor : 'self_male'),
    guardian_name:       gv('f-guardianname'),
    // Single checkbox now covers both confirmations — the backend still
    // tracks them as two distinct consents (guardian_declaration_accepted /
    // tos_agreement_accepted), so both fields are sent from the one checked
    // state rather than changing what's stored.
    guardian_declaration: document.getElementById('f-registration-agreement') ? document.getElementById('f-registration-agreement').checked : false,
    tos_agreement:        document.getElementById('f-registration-agreement') ? document.getElementById('f-registration-agreement').checked : false,
    gender:              gv('f-gender'),
    date_of_birth:       gv('f-dob'),
    marital_status:      gv('f-marital'),
    children:            gv('f-children'),
    height:              gv('f-height'),
    religion:            gv('f-religion'),
    sect:                gv('f-sect'),
    ethnicity:           gv('f-ethnicity'),
    caste:               resolvedCaste,
    piety_level:         gv('f-piety'),
    education:           gv('f-education'),
    study_field:         gv('f-studyfield'),
    institution:         gv('f-institution'),
    employment_status:   gv('f-employment'),
    profession:          resolvedProfession,
    monthly_income:      gv('f-income'),
    employer:            gv('f-employer'),
    country:             gv('f-country'),
    city:                resolvedCity,
    area:                gv('f-area'),
    residence_status:    gv('f-residencestatus'),
    house_size:          gv('f-housesize'),
    family_arrangement:  gv('f-familytype'),
    partner_age_min:     gv('f-partnerage-min'),
    partner_age_max:     gv('f-partnerage-max'),
    partner_city:        gv('f-partnercity'),
    partner_education:   gv('f-partneredu'),
    partner_divorced_ok: gv('f-partnerdivorced'),
    partner_description: gv('f-partnerdesc'),
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
    privacy_preset:      document.getElementById('f-privacy-preset') ? document.getElementById('f-privacy-preset').value : 'standard',
    priv_photo:          document.getElementById('priv-photo') ? document.getElementById('priv-photo').checked : false,
    priv_family:         document.getElementById('priv-family') ? document.getElementById('priv-family').checked : false,
    priv_income:         document.getElementById('priv-income') ? document.getElementById('priv-income').checked : false,
    priv_location:       document.getElementById('priv-location') ? document.getElementById('priv-location').checked : false,
    priv_name:           document.getElementById('priv-name') ? document.getElementById('priv-name').checked : false,
    priv_marital:        document.getElementById('priv-marital') ? document.getElementById('priv-marital').checked : false
    // contact_preference/contact_method/contact_hours/contact_note removed
    // — the "Contact via Rishta Square Only" registration toggle they came
    // from is gone (contact number is never auto-shown to anyone now,
    // regardless of preference — see fetchMaskedProfile on the backend).
    // The register endpoint hardcodes contact_preference to 'direct' for
    // every new registration; Premium members can opt into routing contact
    // through Rishta Square staff from their dashboard after registering.
  };

  // Validation
  if (!payload.full_name) { alert('Please enter your full name.'); return; }
  if (!payload.email)     { alert('Please enter your email address.'); return; }
  if (!payload.mobile)    { alert('Please enter your mobile number.'); return; }
  if (!payload.password || payload.password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }
  if (!payload.guardian_declaration || !payload.tos_agreement) {
    alert('Please confirm the registration declaration and agree to the Terms of Service before continuing.');
    return;
  }
  if (payload.cnic && payload.cnic.replace(/\D/g, '').length !== 13) {
    alert('CNIC must be 13 digits, or leave it blank.');
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
      if (typeof skMirrorSession === 'function') skMirrorSession(true);

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
      // once admin verifies the payment screenshot sent via WhatsApp/email.
      // Amount is computed server-side (campaign-aware — see
      // utils/promotions.js), not guessed here, so the success screen below
      // shows whatever this member was actually charged.
      var bankTransferResult = await apiCall('/payment/bank-transfer', 'POST', {
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
        var pkgAmounts = { basic: 10000, premium: 35000 };
        var chargedAmount = (bankTransferResult.success && bankTransferResult.data && bankTransferResult.data.amount != null)
          ? bankTransferResult.data.amount
          : (pkgAmounts[payload.package] || 10000);
        pkgDisplay.textContent = 'PKR ' + Number(chargedAmount).toLocaleString();
      }
      var successPromoNote = document.getElementById('success-promo-note');
      if (successPromoNote) {
        if (window.activePromotion) {
          successPromoNote.style.display = 'inline-block';
          successPromoNote.textContent = '🎉 ' + window.activePromotion.name + ' — promotional pricing applied';
        } else {
          successPromoNote.style.display = 'none';
        }
      }

      // The visible button is the reliable path (a real click, not an
      // after-await popup — see autoNotifyWhatsApp above), so it needs the
      // same pre-filled message the "How this works" copy promises.
      var waBtn = document.getElementById('success-wa-btn');
      if (waBtn) {
        waBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildWhatsAppRegistrationMessage(payload));
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
    // Used by the dashboard to show what's new since this member's last visit
    if (result.data.previous_login_at) {
      localStorage.setItem('sk_previous_login_at', result.data.previous_login_at);
    } else {
      localStorage.removeItem('sk_previous_login_at');
    }
    if (typeof skMirrorSession === 'function') skMirrorSession(true);
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
        errorEl.textContent = result.message || 'Invalid login or password. Please try again.';
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

// Shared by every page's Logout control (dashboard topbar/sidebar, homepage
// nav/hero) so the confirmation prompt behaves identically everywhere.
function handleLogout() {
  if (confirm('Are you sure you want to log out?')) {
    logout();
  }
}

function logout() {
  if (typeof skUnregisterPush === 'function') skUnregisterPush();
  if (typeof skMirrorSession === 'function') skMirrorSession(false);
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
