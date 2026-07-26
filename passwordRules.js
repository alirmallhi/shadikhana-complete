// passwordRules.js
// Shared new-password validation — used by both the member dashboard's
// Change Password form and the public reset-password page, so the two
// rules (length + confirmation match) live in exactly one place.

function validateNewPassword(newPassword, confirmPassword) {
  if (!newPassword || !confirmPassword) {
    return { valid: false, message: 'Please fill in all fields.' };
  }
  if (newPassword.length < 6) {
    return { valid: false, message: 'New password must be at least 6 characters.' };
  }
  if (newPassword !== confirmPassword) {
    return { valid: false, message: 'New password and confirmation do not match.' };
  }
  return { valid: true, message: '' };
}
