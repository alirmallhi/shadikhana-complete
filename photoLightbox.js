// photoLightbox.js
// Full-size photo view — tap/click anywhere on the overlay, or the close
// button, to dismiss. No zoom, no swipe/carousel between multiple photos,
// deliberately kept simple.
//
// Shared by dashboard.html (member cards, profile detail) and admin.html
// (member profile view, from both the Members tab and Smart Matching) —
// one implementation instead of a second copy. Self-contained: injects its
// own markup/styles into the page on load, so any page just needs to load
// this script and call openPhotoLightbox(url); no per-page HTML/CSS to
// duplicate. Assumes it's loaded near the end of <body> (same convention
// every page here already follows for its own scripts), so document.body
// is already there by the time this runs.

(function () {
  var style = document.createElement('style');
  style.textContent =
    // z-index has to clear the highest overlay in either host page —
    // admin.html's own profile-detail modal (.admin-modal-overlay, and
    // #admin-login-gate) both sit at 9999, which is what was trapping the
    // lightbox behind that modal instead of on top of it. Set comfortably
    // above that (dashboard.html's own modals only go up to 200) so the
    // lightbox is reliably the topmost layer regardless of which page/
    // modal it's opened from.
    '.photo-lightbox{display:none;position:fixed;inset:0;z-index:100000;background:rgba(10,8,12,0.94);' +
    'align-items:center;justify-content:center;padding:2.5rem 1.5rem;cursor:pointer}' +
    '.photo-lightbox.open{display:flex}' +
    '.photo-lightbox img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;cursor:default}' +
    '.photo-lightbox-close{position:absolute;top:1.2rem;right:1.2rem;background:rgba(255,255,255,0.15);' +
    'color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:1.2rem;cursor:pointer;' +
    'display:flex;align-items:center;justify-content:center;line-height:1}';
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.className = 'photo-lightbox';
  overlay.id = 'photo-lightbox';
  overlay.onclick = function () { closePhotoLightbox(); };

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'photo-lightbox-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = function (e) { e.stopPropagation(); closePhotoLightbox(); };

  var img = document.createElement('img');
  img.id = 'photo-lightbox-img';
  img.alt = 'Full-size photo';

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  window.openPhotoLightbox = function (url) {
    if (!url) return;
    img.src = url;
    overlay.classList.add('open');
  };
  window.closePhotoLightbox = function () {
    overlay.classList.remove('open');
    img.src = '';
  };
})();
