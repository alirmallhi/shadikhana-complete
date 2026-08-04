// formOptions.js
// Single source of truth for the controlled-vocabulary dropdown options used
// by both the public registration form (index.html) and the admin "Add
// Member" form (admin.html). Smart Matching's filters depend on members
// sharing the exact same option text regardless of which form created their
// profile — keeping one shared list here (instead of two copies that can
// drift apart) is what guarantees that.

var RS_MARITAL_STATUS = ['Never Married', 'Divorced', 'Widowed', 'Separated'];

var RS_CHILDREN = [
  'No Children',
  '1 Child (living with me)',
  '1 Child (not with me)',
  '2 Children (living with me)',
  '2 Children (not with me)',
  '3+ Children'
];

var RS_HEIGHT = [
  '4\'8"', '4\'9"', '4\'10"', '4\'11"',
  '5\'0"', '5\'1"', '5\'2"', '5\'3"',
  '5\'4"', '5\'5"', '5\'6"', '5\'7"',
  '5\'8"', '5\'9"', '5\'10"', '5\'11"',
  '6\'0"', '6\'1"', '6\'2"', '6\'3"+'
];

var RS_COMPLEXION = ['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Brown', 'Dark'];

var RS_BODY_TYPE = ['Slim / Lean', 'Athletic', 'Average', 'Heavyset', 'Prefer not to say'];

var RS_RELIGION = ['Islam', 'Christianity', 'Hinduism', 'Other'];

var RS_SECT = [
  'Sunni – Barelvi', 'Sunni – Deobandi', 'Sunni – Ahle Hadith', 'Sunni – Other',
  'Shia – Ithna Ashari', 'Shia – Ismaili', 'Shia – Other', 'Ahmadi',
  'Non-Denominational', 'Prefer not to say'
];

var RS_ETHNICITY = [
  'Punjabi', 'Urdu Speaking / Muhajir', 'Sindhi', 'Pashtun', 'Baloch',
  'Saraiki', 'Kashmiri', 'Hazara', 'Gilgiti / Baltistani', 'Other'
];

var RS_CASTE = [
  { group: 'Syed / Sadat', options: ['Syed'] },
  { group: 'Punjabi', options: ['Awan', 'Arain', 'Rajput', 'Jat', 'Gujjar', 'Sheikh', 'Chaudhry', 'Mian', 'Butt', 'Mughal', 'Malik'] },
  { group: 'Urdu Speaking', options: ['Ansari', 'Siddiqui', 'Farooqi', 'Qureshi', 'Abbasi'] },
  { group: 'Sindhi / Baloch', options: ['Sindhi – Memon', 'Sindhi – Soomro', 'Baloch – Marri', 'Baloch – Bugti'] },
  { group: 'Pashtun', options: ['Yusufzai', 'Durrani', 'Afridi', 'Khattak'] },
  { options: ['Other (specify in description)', 'Does Not Matter'] }
];

var RS_PIETY = [
  'Very Religious (observant)',
  'Moderately Religious',
  'Cultural / Traditional',
  'Spiritual but not strict',
  'Prefer not to say'
];

var RS_EDUCATION = [
  'Matric (Grade 10)',
  'Intermediate (Grade 12 / F.A / F.Sc)',
  'Diploma / Certificate',
  "Bachelor's (BA / BSc / BBA / MBBS etc.)",
  "Master's (MA / MSc / MBA / MS etc.)",
  'M.Phil / MPhil',
  'PhD / Doctorate',
  'Islamic Studies / Aalim',
  'Other'
];

// Appends options (and, for grouped lists like RS_CASTE, <optgroup> blocks)
// to an existing <select> — leaves whatever's already in the select (e.g. a
// static placeholder <option value="">Select X</option>) untouched.
function rsPopulateSelect(selectEl, options) {
  if (!selectEl) return;
  options.forEach(function(opt) {
    if (opt && typeof opt === 'object' && opt.options) {
      if (opt.group) {
        var og = document.createElement('optgroup');
        og.label = opt.group;
        opt.options.forEach(function(o) { og.appendChild(new Option(o, o)); });
        selectEl.appendChild(og);
      } else {
        // Ungrouped trailing options (e.g. RS_CASTE's "Other"/"Does Not
        // Matter") — appended as plain top-level <option>s, not wrapped
        // in a label-less <optgroup>, to match the original markup exactly.
        opt.options.forEach(function(o) { selectEl.appendChild(new Option(o, o)); });
      }
    } else {
      selectEl.appendChild(new Option(opt, opt));
    }
  });
}

// ── SECT DEPENDS ON RELIGION ──
// Sect only has real, meaningful data for Islam (RS_SECT is entirely
// Sunni/Shia/Ahmadi/etc.) — for every other religion there's no such
// concept, so the field is hidden and any previously selected value is
// cleared, rather than showing Islam's sect list or a dropdown with no
// options. Shared by registration, profile edit, and the Browse filter so
// all three stay in sync with RS_SECT instead of three separate copies of
// this logic drifting apart.
// `container`, if given, is what actually gets hidden/shown instead of the
// select itself — for forms where Sect has its own <label> that would
// otherwise be left dangling with nothing under it (Browse's filter bar
// has no per-field labels, so it can omit this).
function rsSyncSectToReligion(religionSelect, sectSelect, container) {
  if (!religionSelect || !sectSelect) return;
  var target = container || sectSelect;
  if (religionSelect.value === 'Islam') {
    if (sectSelect.options.length <= 1 && typeof RS_SECT !== 'undefined') {
      rsPopulateSelect(sectSelect, RS_SECT);
    }
    target.style.display = '';
  } else {
    sectSelect.value = '';
    target.style.display = 'none';
  }
}
