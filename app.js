// KYU CONNECT App Navigation & Fast Page Switching

const iframe = document.getElementById('content-frame');
const navLinks = document.querySelectorAll('.nav-link');
const loginBtn = document.querySelector('.btn-login');
const signupBtn = document.querySelector('.btn-signup');
const userStatus = document.getElementById('user-status');

function setActiveLink(link) {
    navLinks.forEach(l => l.classList.remove('active'));
    if (link) link.classList.add('active');
}

function changePage(url, link) {
    if (!iframe) return;
    setActiveLink(link);
    iframe.classList.remove('loaded');
    iframe.src = url;
}

function updateHeaderUser() {
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    if (!user || !user.name) {
        if (userStatus) userStatus.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (signupBtn) signupBtn.style.display = 'inline-flex';
        return;
    }
    if (userStatus) {
        userStatus.innerHTML = `<i class="fas fa-user-check"></i> ${user.name}`;
        userStatus.style.display = 'inline-flex';
    }
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
}

function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            changePage(link.getAttribute('href'), link);
        });
    });

    if (loginBtn) {
        loginBtn.addEventListener('click', event => {
            event.preventDefault();
            setActiveLink(null);
            changePage(loginBtn.getAttribute('href'));
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', event => {
            event.preventDefault();
            setActiveLink(null);
            changePage(signupBtn.getAttribute('href'));
        });
    }

    if (iframe) {
        iframe.addEventListener('load', () => {
            iframe.style.opacity = '1';
            iframe.classList.add('loaded');
        });
    }
}

function fastStyleTweaks() {
    const navButtons = document.querySelectorAll('.nav-link, .btn');
    navButtons.forEach(button => {
        button.style.willChange = 'transform, background-color';
    });
}

updateHeaderUser();
initNavigation();
fastStyleTweaks();
