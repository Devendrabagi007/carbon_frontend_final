'use strict';
document.querySelectorAll('.password-toggle').forEach(button => button.addEventListener('click', () => {
 const input = document.getElementById(button.dataset.for), showing = input.type === 'password';
 input.type = showing ? 'text' : 'password'; button.textContent = showing ? 'Hide' : 'Show';
 button.setAttribute('aria-pressed', String(showing)); button.setAttribute('aria-label', (showing ? 'Hide ' : 'Show ') + input.labels[0].textContent);
}));
