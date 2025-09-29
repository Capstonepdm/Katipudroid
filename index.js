// index.js - Fixed: Remove duplicate carousel dots

// Global variables
let firebaseReady = false;
let feedbackFormSubmitting = false;
let otpSent = false;
let currentFormData = null;
let otpTimer = null;
let otpTimeLeft = 600; // 10 minutes in seconds

// Owl Carousel initialization - FIXED: No more duplicate dots
$(document).ready(function () {
  console.log('📱 DOM loaded, initializing...');
  
  // Initialize Owl Carousel with navigation
  const carousel = $(".custom-carousel").owlCarousel({
    autoWidth: true,
    loop: true,
    margin: 10,
    nav: false,
    dots: true,
    dotsEach: false,
    dotsContainer: false,
    mouseDrag: true,
    touchDrag: true,
    smartSpeed: 600,
    autoplay: false,
    responsive: {
      0: {
        items: 1,
        dots: true
      },
      600: {
        items: 2,
        dots: true
      },
      1000: {
        items: 3,
        dots: true
      }
    },
    onInitialized: function(event) {
      // Remove ALL duplicate dots on initialization
      removeDuplicateDots();
      console.log('✅ Owl Carousel initialized - dots cleaned');
    },
    onChanged: function(event) {
      // Remove duplicates after any change
      removeDuplicateDots();
    },
    onRefreshed: function(event) {
      // Remove duplicates after refresh
      removeDuplicateDots();
    }
  });

  // Function to remove duplicate dots
  function removeDuplicateDots() {
    // Keep only the first .owl-dots, remove all others
    const allDots = $('.owl-dots');
    if (allDots.length > 1) {
      allDots.slice(1).remove();
      console.log('🧹 Removed duplicate dots');
    }
  }

  // Handle item clicks
  $(".custom-carousel .item").click(function () {
    $(".custom-carousel .item").not($(this)).removeClass("active");
    $(this).toggleClass("active");
  });

  // Custom arrow navigation
  $("#nextBtn").click(function() {
    carousel.trigger('next.owl.carousel');
  });

  $("#prevBtn").click(function() {
    carousel.trigger('prev.owl.carousel');
  });

  // Keyboard navigation
  $(document).keydown(function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      if (e.keyCode === 37) {
        carousel.trigger('prev.owl.carousel');
      } else if (e.keyCode === 39) {
        carousel.trigger('next.owl.carousel');
      }
    }
  });

  // Auto-play functionality (optional)
  let autoplayInterval;
  
  function startAutoplay() {
    autoplayInterval = setInterval(function() {
      carousel.trigger('next.owl.carousel');
    }, 5000);
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  // Pause autoplay on hover
  $('.carousel-container').hover(
    function() {
      stopAutoplay();
    },
    function() {
      // Uncomment to resume autoplay after hover
      // startAutoplay();
    }
  );

  // FINAL CLEANUP: Remove any remaining duplicate dots after everything loads
  setTimeout(function() {
    removeDuplicateDots();
  }, 1000);

  // Also clean up after window resize
  $(window).on('resize', function() {
    setTimeout(removeDuplicateDots, 100);
  });

  // Continue with your existing app initialization...
  initializeApp();
});

// Main app initialization
async function initializeApp() {
  console.log('🚀 Initializing KATIPUDROID app...');
  
  try {
    initializeStarRating();
    initializeMobileMenu();
    initializeOTPSystem();
    await waitForFirebaseAndLoad();
    initializeFeedbackForm();
    
    console.log('✅ App initialization complete');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    showFirebaseError();
  }
}

// Wait for Firebase and then load feedbacks
async function waitForFirebaseAndLoad() {
  console.log('🔥 Waiting for Firebase...');
  
  try {
    if (window.waitForFirebase) {
      await window.waitForFirebase();
      console.log('✅ Firebase ready via waitForFirebase');
      firebaseReady = true;
      loadFeedbacks();
    } else {
      console.log('⏳ Using fallback Firebase check...');
      let attempts = 0;
      const maxAttempts = 100;
      
      const checkFirebase = setInterval(() => {
        attempts++;
        console.log(`🔄 Firebase check attempt ${attempts}/${maxAttempts}`);
        
        if (window.firebaseDb && window.getRecentFeedbacks) {
          clearInterval(checkFirebase);
          console.log(`✅ Firebase ready after ${attempts} attempts`);
          firebaseReady = true;
          loadFeedbacks();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkFirebase);
          console.error('❌ Firebase failed to load after 10 seconds');
          showFirebaseError();
        }
      }, 100);
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    showFirebaseError();
  }
}

// Initialize OTP system
function initializeOTPSystem() {
  console.log('🔐 Initializing OTP system...');
  
  const otpInput = document.getElementById('otp-input');
  const resendBtn = document.getElementById('resend-btn');
  
  if (otpInput) {
    otpInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      
      if (e.target.value.length === 6) {
        verifyOTPAndSubmit();
      }
    });
  }
  
  if (resendBtn) {
    resendBtn.addEventListener('click', resendOTP);
  }
  
  console.log('✅ OTP system initialized');
}

// Update step indicator
function updateStepIndicator(step) {
  const steps = ['step1', 'step2', 'step3'];
  
  steps.forEach((stepId, index) => {
    const stepElement = document.getElementById(stepId);
    if (!stepElement) return;
    
    stepElement.classList.remove('active', 'completed');
    
    if (index + 1 < step) {
      stepElement.classList.add('completed');
    } else if (index + 1 === step) {
      stepElement.classList.add('active');
    }
  });
}

// Show Firebase error message
function showFirebaseError() {
  const feedbackList = document.getElementById('feedback-list');
  if (feedbackList) {
    feedbackList.innerHTML = `
      <div class="feedback-card" style="text-align: center; border: 2px solid #ff4655; background: rgba(255, 70, 85, 0.1);">
        <h4 style="color: #ff4655; margin-bottom: 1rem;">
          <i class="fas fa-exclamation-triangle"></i> Database Connection Issue
        </h4>
        <p style="margin-bottom: 1rem;">Unable to connect to Firebase database.</p>
        <button onclick="location.reload()" class="download-btn" style="margin-top: 1rem;">
          <i class="fas fa-refresh"></i> Retry Connection
        </button>
      </div>
    `;
  }
}

// Initialize star rating functionality
function initializeStarRating() {
  console.log('⭐ Initializing star rating...');
  
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('rating');
  const ratingText = document.getElementById('rating-text');
  
  const ratingLabels = {
    1: '1 Star - Poor',
    2: '2 Stars - Fair', 
    3: '3 Stars - Good',
    4: '4 Stars - Very Good',
    5: '5 Stars - Excellent'
  };
  
  if (stars.length === 0) {
    console.log('ℹ️ No star elements found, skipping star rating init');
    return;
  }
  
  updateStarDisplay(5);
  if (ratingInput) ratingInput.value = 5;
  if (ratingText) ratingText.textContent = ratingLabels[5];
  
  stars.forEach((star, index) => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      console.log('⭐ Star clicked:', rating);
      
      if (ratingInput) ratingInput.value = rating;
      updateStarDisplay(rating);
      
      if (ratingText) {
        ratingText.textContent = ratingLabels[rating];
        ratingText.classList.add('animate');
        setTimeout(() => ratingText.classList.remove('animate'), 400);
      }
    });
    
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      updateStarDisplay(rating);
      if (ratingText) ratingText.textContent = ratingLabels[rating];
    });
  });
  
  const starRating = document.getElementById('star-rating');
  if (starRating && ratingInput && ratingText) {
    starRating.addEventListener('mouseleave', function() {
      const currentRating = parseInt(ratingInput.value);
      updateStarDisplay(currentRating);
      ratingText.textContent = ratingLabels[currentRating];
    });
  }
  
  console.log('✅ Star rating initialized');
}

// Update star display
function updateStarDisplay(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

// Load recent feedbacks using Firebase
async function loadFeedbacks() {
  console.log('📝 Loading feedbacks...');
  
  const feedbackList = document.getElementById('feedback-list');
  
  if (!feedbackList) {
    console.log('ℹ️ Feedback list element not found, skipping feedback load');
    return;
  }
  
  feedbackList.innerHTML = `
    <div class="feedback-card" style="text-align: center;">
      <i class="fas fa-spinner fa-spin fa-2x" style="color: #ff4655; margin-bottom: 1rem;"></i>
      <h4>Loading feedbacks...</h4>
      <p>Connecting to database...</p>
    </div>
  `;
  
  try {
    if (!window.getRecentFeedbacks) {
      console.error('❌ Firebase function getRecentFeedbacks not available');
      showFirebaseError();
      return;
    }

    console.log('🔄 Calling getRecentFeedbacks...');
    const data = await window.getRecentFeedbacks(10);
    
    if (data.success && data.feedbacks) {
      console.log(`✅ Loaded ${data.feedbacks.length} feedbacks from Firebase`);
      
      feedbackList.innerHTML = '';
      
      if (data.feedbacks.length === 0) {
        feedbackList.innerHTML = `
          <div class="feedback-card" style="text-align: center; background: rgba(255, 255, 255, 0.05);">
            <i class="fas fa-comment-dots fa-3x" style="color: #ff4655; margin-bottom: 1rem; opacity: 0.7;"></i>
            <h4>No feedbacks yet</h4>
            <p>Be the first to share your thoughts about KATIPUDROID!</p>
            <a href="#message" class="download-btn" style="margin-top: 1rem; text-decoration: none;">
              <i class="fas fa-plus"></i> Add First Feedback
            </a>
          </div>
        `;
        return;
      }
      
      const recentFeedbacks = data.feedbacks.slice(0, 3);
      
      recentFeedbacks.forEach((feedback, index) => {
        console.log(`📝 Adding feedback ${index + 1}:`, feedback.name);
        
        const card = document.createElement('div');
        card.classList.add('feedback-card');
        
        const date = new Date(feedback.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        const stars = createStarDisplay(feedback.rating || 5);
        
        card.innerHTML = `
          <div class="feedback-rating">
            <div class="feedback-stars">${stars}</div>
            <span class="rating-text">${feedback.rating || 5}/5</span>
          </div>
          <h4>${escapeHtml(feedback.name)} 
            <small style="color: #999; font-size: 0.8em;">(${formattedDate})</small>
          </h4>
          <p>${escapeHtml(feedback.message)}</p>
        `;
        
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        feedbackList.appendChild(card);
        
        setTimeout(() => {
          card.style.transition = 'all 0.5s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 200);
      });
      
      if (data.feedbacks.length > 3) {
        const showMoreBtn = document.createElement('div');
        showMoreBtn.classList.add('feedback-card', 'show-more-card');
        showMoreBtn.innerHTML = `
          <div style="text-align: center; padding: 1.5rem;">
            <i class="fas fa-plus-circle" style="font-size: 2.5rem; color: #ff4655; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem; color: #ff4655;">View All Feedbacks</h4>
            <p style="margin-bottom: 1.5rem; color: #ccc;">
              See all ${data.feedbacks.length} feedbacks from our amazing community
            </p>
            <a href="src/feedbacks.html" class="download-btn" style="display: inline-block; text-decoration: none; font-size: 1rem; padding: 0.8rem 1.5rem;">
              Show More <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        `;
        
        showMoreBtn.style.opacity = '0';
        showMoreBtn.style.transform = 'translateY(20px)';
        feedbackList.appendChild(showMoreBtn);
        
        setTimeout(() => {
          showMoreBtn.style.transition = 'all 0.5s ease';
          showMoreBtn.style.opacity = '1';
          showMoreBtn.style.transform = 'translateY(0)';
        }, recentFeedbacks.length * 200);
      }
      
      console.log(`✅ Successfully displayed ${recentFeedbacks.length} feedbacks on home page`);
      
    } else {
      console.error('❌ Failed to load feedbacks:', data.message || 'Unknown error');
      feedbackList.innerHTML = `
        <div class="feedback-card" style="text-align: center; border: 2px solid #ff4655;">
          <i class="fas fa-exclamation-triangle fa-2x" style="color: #ff4655; margin-bottom: 1rem;"></i>
          <h4>Failed to Load Feedbacks</h4>
          <p>${data.message || 'Unknown error occurred'}</p>
          <button onclick="loadFeedbacks()" class="download-btn" style="margin-top: 1rem;">
            <i class="fas fa-refresh"></i> Try Again
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error loading feedbacks:', error);
    feedbackList.innerHTML = `
      <div class="feedback-card" style="text-align: center; border: 2px solid #ff4655;">
        <i class="fas fa-exclamation-triangle fa-2x" style="color: #ff4655; margin-bottom: 1rem;"></i>
        <h4>Connection Error</h4>
        <p>Unable to load feedbacks: ${error.message}</p>
        <button onclick="loadFeedbacks()" class="download-btn" style="margin-top: 1rem;">
          <i class="fas fa-refresh"></i> Try Again
        </button>
      </div>
    `;
  }
}

// Initialize feedback form
function initializeFeedbackForm() {
  console.log('📝 Initializing feedback form...');
  
  const feedbackForm = document.getElementById('feedback-form');
  
  if (!feedbackForm) {
    console.log('ℹ️ Feedback form not found, skipping form initialization');
    return;
  }
  
  feedbackForm.addEventListener('submit', handleFeedbackSubmit);
  console.log('✅ Feedback form initialized');
}

// Handle feedback form submission
async function handleFeedbackSubmit(e) {
  e.preventDefault();
  
  if (feedbackFormSubmitting) {
    console.log('⚠️ Form already submitting, ignoring duplicate submission');
    return;
  }
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  
  try {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('messageText').value.trim();
    const rating = document.getElementById('rating').value;
    
    if (!name || !email || !message || !rating) {
      alert('Please fill in all fields and select a rating');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    if (otpSent) {
      await verifyOTPAndSubmit();
      return;
    }
    
    currentFormData = { name, email, message, rating: parseInt(rating) };
    
    console.log('📤 Sending OTP to:', email);
    feedbackFormSubmitting = true;
    
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';
    submitBtn.disabled = true;
    
    if (!firebaseReady || !window.generateAndSendOTP) {
      alert('Database connection not ready. Please wait a moment and try again.');
      return;
    }
    
    const result = await window.generateAndSendOTP(email, name);
    
    if (result.success) {
      console.log('✅ OTP sent successfully');
      
      showOTPSection();
      updateStepIndicator(2);
      
      submitBtn.textContent = 'Verify & Submit Feedback';
      submitBtn.disabled = false;
      otpSent = true;
      
      startOTPTimer();
      
      showSuccessMessage('OTP Sent!', 
        `A 6-digit verification code has been sent to ${email}. Please check your email and enter the code below.`);
      
    } else {
      console.error('❌ Failed to send OTP:', result.message);
      alert('Failed to send OTP: ' + result.message);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    alert('Error sending OTP. Please check your internet connection and try again.');
    submitBtn.textContent = 'Send OTP & Verify';
    submitBtn.disabled = false;
  } finally {
    feedbackFormSubmitting = false;
  }
}

// Show OTP verification section
function showOTPSection() {
  const otpSection = document.getElementById('otp-section');
  if (otpSection) {
    otpSection.classList.add('show');
    
    setTimeout(() => {
      const otpInput = document.getElementById('otp-input');
      if (otpInput) {
        otpInput.focus();
      }
    }, 300);
  }
}

// Start OTP timer
function startOTPTimer() {
  otpTimeLeft = 600;
  const timerElement = document.getElementById('otp-timer');
  const resendBtn = document.getElementById('resend-btn');
  
  if (resendBtn) {
    resendBtn.disabled = true;
  }
  
  otpTimer = setInterval(() => {
    otpTimeLeft--;
    
    const minutes = Math.floor(otpTimeLeft / 60);
    const seconds = otpTimeLeft % 60;
    
    if (timerElement) {
      timerElement.textContent = `Code expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (otpTimeLeft <= 0) {
      clearInterval(otpTimer);
      if (timerElement) {
        timerElement.textContent = 'Code expired! Please request a new one.';
        timerElement.style.color = '#ff4655';
      }
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Send New Code';
      }
    } else if (otpTimeLeft <= 60) {
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i class="fas fa-redo"></i> Resend Code';
      }
    }
  }, 1000);
}

// Resend OTP
async function resendOTP() {
  if (!currentFormData) {
    alert('Please fill the form first');
    return;
  }
  
  const resendBtn = document.getElementById('resend-btn');
  const originalText = resendBtn.textContent;
  
  try {
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    resendBtn.disabled = true;
    
    const result = await window.generateAndSendOTP(currentFormData.email, currentFormData.name);
    
    if (result.success) {
      console.log('✅ OTP resent successfully');
      
      clearInterval(otpTimer);
      startOTPTimer();
      
      const otpInput = document.getElementById('otp-input');
      if (otpInput) {
        otpInput.value = '';
        otpInput.focus();
      }
      
      showSuccessMessage('New OTP Sent!', 
        `A new verification code has been sent to ${currentFormData.email}.`);
      
    } else {
      console.error('❌ Failed to resend OTP:', result.message);
      alert('Failed to resend OTP: ' + result.message);
    }
    
  } catch (error) {
    console.error('❌ Error resending OTP:', error);
    alert('Error resending OTP. Please try again.');
  } finally {
    resendBtn.textContent = originalText;
    resendBtn.disabled = false;
  }
}

// Verify OTP and submit feedback
async function verifyOTPAndSubmit() {
  const otpInput = document.getElementById('otp-input');
  const submitBtn = document.getElementById('submit-btn');
  
  if (!otpInput || !currentFormData) {
    alert('Please fill the form and request OTP first');
    return;
  }
  
  const otp = otpInput.value.trim();
  
  if (otp.length !== 6) {
    alert('Please enter a valid 6-digit OTP');
    otpInput.focus();
    return;
  }
  
  try {
    feedbackFormSubmitting = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    submitBtn.disabled = true;
    
    console.log('🔐 Verifying OTP...');
    
    const verifyResult = await window.verifyOTP(currentFormData.email, otp);
    
    if (verifyResult.success) {
      console.log('✅ OTP verified successfully');
      
      updateStepIndicator(3);
      
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      
      console.log('📤 Submitting feedback...');
      const submitResult = await window.submitFeedback(currentFormData);
      
      if (submitResult.success) {
        console.log('✅ Feedback submitted successfully!');
        
        clearInterval(otpTimer);
        
        showSuccessMessage('Feedback Submitted Successfully!', 
          `Thank you ${currentFormData.name}! Your ${currentFormData.rating}-star review has been submitted and will appear on our website shortly.`);
        
        resetForm();
        
        setTimeout(() => {
          loadFeedbacks();
        }, 2000);
        
      } else {
        console.error('❌ Failed to submit feedback:', submitResult.message);
        alert('Failed to submit feedback: ' + submitResult.message);
      }
      
    } else {
      console.error('❌ OTP verification failed:', verifyResult.message);
      alert(verifyResult.message);
      otpInput.value = '';
      otpInput.focus();
    }
    
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    alert('Error verifying OTP. Please try again.');
  } finally {
    submitBtn.textContent = 'Verify & Submit Feedback';
    submitBtn.disabled = false;
    feedbackFormSubmitting = false;
  }
}

// Reset form to initial state
function resetForm() {
  const form = document.getElementById('feedback-form');
  if (form) {
    form.reset();
  }
  
  document.getElementById('rating').value = 5;
  updateStarDisplay(5);
  const ratingText = document.getElementById('rating-text');
  if (ratingText) {
    ratingText.textContent = '5 Stars - Excellent';
  }
  
  const otpSection = document.getElementById('otp-section');
  if (otpSection) {
    otpSection.classList.remove('show');
  }
  
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.textContent = 'Send OTP & Verify';
  }
  
  clearInterval(otpTimer);
  updateStepIndicator(1);
  
  otpSent = false;
  currentFormData = null;
  feedbackFormSubmitting = false;
}

// Show custom success message
function showSuccessMessage(title, message) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
  `;
  
  modal.innerHTML = `
    <div style="
      background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
      padding: 2rem;
      border-radius: 15px;
      text-align: center;
      max-width: 400px;
      margin: 1rem;
      border: 2px solid #ff4655;
      box-shadow: 0 20px 40px rgba(255,70,85,0.3);
    ">
      <i class="fas fa-check-circle" style="font-size: 3rem; color: #00ff00; margin-bottom: 1rem;"></i>
      <h3 style="color: #ff4655; margin-bottom: 1rem;">${title}</h3>
      <p style="color: #ccc; margin-bottom: 2rem; line-height: 1.5;">${message}</p>
      <button onclick="this.closest('div').parentElement.remove()" 
              style="background: #ff4655; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
        <i class="fas fa-thumbs-up"></i> Awesome!
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 8000);
}

// Initialize mobile menu
function initializeMobileMenu() {
  console.log('📱 Initializing mobile menu...');
  
  const menuToggle = document.getElementById('menu-toggle');
  const navbar = document.getElementById('navbar');
  
  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => {
      console.log('📱 Mobile menu toggled');
      navbar.classList.toggle('active');
    });
    console.log('✅ Mobile menu initialized');
  } else {
    console.log('ℹ️ Mobile menu elements not found');
  }
}

// Helper function to create star display
function createStarDisplay(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<span class="feedback-star filled">★</span>';
    } else {
      stars += '<span class="feedback-star">★</span>';
    }
  }
  return stars;
}

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Make some functions available globally
window.KATIPUDROID = {
  loadFeedbacks,
  firebaseReady: () => firebaseReady,
  resetForm,
  testConnection: () => {
    console.log('🧪 Testing connection...');
    console.log('Firebase DB:', window.firebaseDb);
    console.log('Submit function:', window.submitFeedback);
    console.log('Get function:', window.getRecentFeedbacks);
    console.log('OTP functions:', window.generateAndSendOTP, window.verifyOTP);
    console.log('Ready state:', firebaseReady);
  }
};

// Log when script loads
console.log('🎮 KATIPUDROID index.js with OTP support loaded successfully');

// Add smooth scrolling for anchor links
document.addEventListener('click', function(e) {
  if (e.target.tagName === 'A' && e.target.getAttribute('href') && e.target.getAttribute('href').startsWith('#')) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (otpTimer) {
    clearInterval(otpTimer);
  }
});