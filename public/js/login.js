/**
 * Taskora Login & Cinematic Page Interactivity
 * Strict Vanilla JavaScript (ES6+) — Zero Frameworks
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. Background Video Lifecycle & Smooth Fade-In
  // =========================================================================
  const bgVideo = document.getElementById('bgVideo');

  if (bgVideo) {
    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      bgVideo.pause();
      bgVideo.style.display = 'none';
    } else {
      const handleVideoReady = () => {
        bgVideo.classList.add('is-loaded');
      };

      if (bgVideo.readyState >= 2) {
        handleVideoReady();
      } else {
        bgVideo.addEventListener('loadeddata', handleVideoReady, { once: true });
        bgVideo.addEventListener('canplay', handleVideoReady, { once: true });
      }

      // Fallback: If network or codecs delay video, show gracefully
      bgVideo.addEventListener('error', () => {
        console.info('Background video playback not available or offline; using high-res golden sunset poster fallback.');
        bgVideo.style.display = 'none';
      });
    }
  }

  // =========================================================================
  // 2. Interactive Feature Slider (Left Section)
  // =========================================================================
  const slides = [
    {
      headline: 'Plan Smarter. <span class="highlight-amber">Stay Focused.</span> Get Things Done.',
      supporting: 'Organize your everyday tasks, manage your priorities and stay on top of everything that matters.',
      label: 'Everyday Task Mastery'
    },
    {
      headline: 'Clarity Under Pressure. <span class="highlight-amber">Priority First.</span>',
      supporting: 'Classify urgent mission items, eliminate bottlenecks, and align your workflow with C2 operational standards.',
      label: 'C2 Priority Tracking'
    },
    {
      headline: 'Visual Kanban. <span class="highlight-amber">Seamless Velocity.</span>',
      supporting: 'Track items from intake to completion with drag-and-drop boards and real-time status updates.',
      label: 'Kanban & Focus Flow'
    }
  ];

  let currentSlideIndex = 0;
  let sliderTimer = null;
  const heroHeadline = document.getElementById('heroHeadline');
  const heroSupporting = document.getElementById('heroSupporting');
  const sliderFeatureLabel = document.getElementById('sliderFeatureLabel');
  const sliderDots = document.querySelectorAll('.slider-dot');
  const brandShowcase = document.querySelector('.brand-showcase');

  function renderSlide(index) {
    if (!slides[index]) return;
    currentSlideIndex = index;
    const slide = slides[index];

    // Smooth transition
    heroSupporting.style.opacity = '0';
    heroSupporting.style.transform = 'translateY(6px)';

    setTimeout(() => {
      heroHeadline.innerHTML = slide.headline;
      heroSupporting.innerHTML = slide.supporting;
      sliderFeatureLabel.textContent = slide.label;

      heroSupporting.style.opacity = '1';
      heroSupporting.style.transform = 'translateY(0)';
    }, 180);

    // Update active dot
    sliderDots.forEach((dot, dotIdx) => {
      if (dotIdx === index) {
        dot.classList.add('is-active');
        dot.setAttribute('aria-selected', 'true');
      } else {
        dot.classList.remove('is-active');
        dot.setAttribute('aria-selected', 'false');
      }
    });
  }

  function startSliderRotation() {
    stopSliderRotation();
    sliderTimer = setInterval(() => {
      const nextIndex = (currentSlideIndex + 1) % slides.length;
      renderSlide(nextIndex);
    }, 6000);
  }

  function stopSliderRotation() {
    if (sliderTimer) {
      clearInterval(sliderTimer);
      sliderTimer = null;
    }
  }

  // Attach dot click handlers
  sliderDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const slideIndex = parseInt(e.currentTarget.getAttribute('data-slide'), 10);
      renderSlide(slideIndex);
      startSliderRotation(); // Reset timer on manual interaction
    });
  });

  // Pause on hover
  if (brandShowcase) {
    brandShowcase.addEventListener('mouseenter', stopSliderRotation);
    brandShowcase.addEventListener('mouseleave', startSliderRotation);
  }

  startSliderRotation();

  // =========================================================================
  // 3. Password Visibility Toggle
  // =========================================================================
  const passwordInput = document.getElementById('loginPassword');
  const passwordToggleBtn = document.getElementById('passwordToggleBtn');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');

  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      eyeIcon.style.display = isPassword ? 'none' : 'block';
      eyeOffIcon.style.display = isPassword ? 'block' : 'none';
      passwordToggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  // =========================================================================
  // 4. Remember Me Management
  // =========================================================================
  const emailInput = document.getElementById('loginEmail');
  const rememberMeCheckbox = document.getElementById('rememberMe');

  const savedEmail = localStorage.getItem('taskora_remembered_email');
  if (savedEmail && emailInput && rememberMeCheckbox) {
    emailInput.value = savedEmail;
    rememberMeCheckbox.checked = true;
  }

  // Quick Autofill Demo Button
  const autofillDemoBtn = document.getElementById('autofillDemoBtn');
  if (autofillDemoBtn && emailInput && passwordInput) {
    autofillDemoBtn.addEventListener('click', () => {
      emailInput.value = 'demo@taskora.com';
      passwordInput.value = 'Taskora123!';
      emailInput.focus();
    });
  }

  // =========================================================================
  // 5. Alert Notification System
  // =========================================================================
  const alertBanner = document.getElementById('alertBanner');
  const alertMessage = document.getElementById('alertMessage');

  function showAlert(msg, type = 'error') {
    if (!alertBanner || !alertMessage) return;
    alertBanner.className = `alert-banner alert-${type}`;
    alertMessage.textContent = msg;
    alertBanner.style.display = 'flex';
  }

  function hideAlert() {
    if (alertBanner) alertBanner.style.display = 'none';
  }

  // =========================================================================
  // 6. View Switcher (Login <-> Register <-> Forgot Password)
  // =========================================================================
  const loginView = document.getElementById('loginView');
  const registerView = document.getElementById('registerView');
  const forgotView = document.getElementById('forgotView');

  const showRegisterLink = document.getElementById('showRegisterLink');
  const showLoginLink = document.getElementById('showLoginLink');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');

  function switchView(viewName) {
    hideAlert();
    loginView.classList.remove('is-visible');
    registerView.classList.remove('is-visible');
    forgotView.classList.remove('is-visible');

    if (viewName === 'register') {
      registerView.classList.add('is-visible');
    } else if (viewName === 'forgot') {
      forgotView.classList.add('is-visible');
    } else {
      loginView.classList.add('is-visible');
    }
  }

  if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); switchView('register'); });
  if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); switchView('login'); });
  if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); switchView('forgot'); });
  if (backToLoginFromForgot) backToLoginFromForgot.addEventListener('click', (e) => { e.preventDefault(); switchView('login'); });

  // =========================================================================
  // 7. Strictly Conditional Google OAuth Check
  // =========================================================================
  const googleAuthSection = document.getElementById('googleAuthSection');
  const googleLoginBtn = document.getElementById('googleLoginBtn');

  async function checkGoogleAuthCapability() {
    try {
      const config = await API.getConfig();
      if (config && config.googleAuthEnabled) {
        googleAuthSection.style.display = 'block';
        if (googleLoginBtn) {
          googleLoginBtn.addEventListener('click', () => {
            window.location.href = `/api/auth/google`;
          });
        }
      } else {
        // Strict requirement: hide if not enabled
        googleAuthSection.style.display = 'none';
      }
    } catch (e) {
      googleAuthSection.style.display = 'none';
    }
  }

  checkGoogleAuthCapability();

  // =========================================================================
  // 8. Login Form Submission
  // =========================================================================
  const loginForm = document.getElementById('loginForm');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const remember = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

      if (!email) {
        showAlert('Please enter your email address.');
        emailInput.focus();
        return;
      }

      if (!password) {
        showAlert('Please enter your password.');
        passwordInput.focus();
        return;
      }

      // Button loading state
      loginSubmitBtn.classList.add('is-loading');
      loginSubmitBtn.disabled = true;

      try {
        await API.login(email, password, remember);

        if (remember) {
          localStorage.setItem('taskora_remembered_email', email);
        } else {
          localStorage.removeItem('taskora_remembered_email');
        }

        showAlert('Authenticated successfully! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 500);
      } catch (err) {
        showAlert(err.message || 'Login failed. Please check your credentials.');
        loginSubmitBtn.classList.remove('is-loading');
        loginSubmitBtn.disabled = false;
      }
    });
  }

  // =========================================================================
  // 9. Register Form Submission
  // =========================================================================
  const registerForm = document.getElementById('registerForm');
  const regFullName = document.getElementById('regFullName');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const fullName = regFullName.value.trim();
      const email = regEmail.value.trim();
      const password = regPassword.value;

      if (!email) {
        showAlert('Email is required for registration.');
        regEmail.focus();
        return;
      }

      if (!password || password.length < 6) {
        showAlert('Password must be at least 6 characters.');
        regPassword.focus();
        return;
      }

      registerSubmitBtn.classList.add('is-loading');
      registerSubmitBtn.disabled = true;

      try {
        await API.register(email, password, fullName);
        showAlert('Account created successfully! Loading your workspace...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 600);
      } catch (err) {
        showAlert(err.message || 'Registration failed.');
        registerSubmitBtn.classList.remove('is-loading');
        registerSubmitBtn.disabled = false;
      }
    });
  }

  // =========================================================================
  // 10. Forgot Password Form Submission
  // =========================================================================
  const forgotForm = document.getElementById('forgotForm');
  const forgotEmail = document.getElementById('forgotEmail');

  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = forgotEmail.value.trim();
      if (!email) {
        showAlert('Please enter your email to receive recovery instructions.');
        return;
      }
      showAlert(`Recovery instructions sent to ${email} (Demo simulation).`, 'success');
      setTimeout(() => {
        switchView('login');
      }, 2000);
    });
  }

  // Check if user is already authenticated
  if (API.getToken()) {
    API.getMe()
      .then(() => {
        // Valid token, offer instant shortcut or redirect
        const user = API.getUser();
        if (user) {
          showAlert(`Active session detected for ${user.email}. Redirecting...`, 'success');
          setTimeout(() => { window.location.href = '/dashboard.html'; }, 600);
        }
      })
      .catch(() => {
        API.clearAuth();
      });
  }

});
