// index.js - Complete Firebase version for KATIPUDROID

// Global variables
let firebaseReady = false;
let feedbackFormSubmitting = false;

// Owl Carousel initialization
$(document).ready(function () {
  console.log('📱 DOM loaded, initializing...');
  
  // Initialize Owl Carousel
  $(".custom-carousel").owlCarousel({
    autoWidth: true,
    loop: true
  });

  $(".custom-carousel .item").click(function () {
    $(".custom-carousel .item").not($(this)).removeClass("active");
    $(this).toggleClass("active");
  });

  // Wait for Firebase to initialize, then load feedbacks
  initializeApp();
});

// Main app initialization
async function initializeApp() {
  console.log('🚀 Initializing KATIPUDROID app...');
  
  try {
    // Initialize star rating first (doesn't need Firebase)
    initializeStarRating();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Wait for Firebase and then load feedbacks
    await waitForFirebaseAndLoad();
    
    // Initialize feedback form
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
    // Check if Firebase wait function exists
    if (window.waitForFirebase) {
      await window.waitForFirebase();
      console.log('✅ Firebase ready via waitForFirebase');
      firebaseReady = true;
      loadFeedbacks();
    } else {
      // Fallback: wait and check periodically
      console.log('⏳ Using fallback Firebase check...');
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds total
      
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
        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.9em; text-align: left;">
          <strong>To fix this:</strong><br>
          1. Create a Firebase project<br>
          2. Enable Firestore Database<br>
          3. Update <code>js/firebase-config.js</code> with your credentials<br>
          4. Make sure the file loads before index.js
        </div>
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
  
  // Set default rating to 5 stars
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
  
  // Reset to selected rating on mouse leave
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

// Load recent feedbacks using Firebase (limit to 3 for home page)
async function loadFeedbacks() {
  console.log('📝 Loading feedbacks...');
  
  const feedbackList = document.getElementById('feedback-list');
  
  if (!feedbackList) {
    console.log('ℹ️ Feedback list element not found, skipping feedback load');
    return;
  }
  
  // Show loading state
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
      
      // Clear loading state
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
      
      // Show only first 3 feedbacks on home page
      const recentFeedbacks = data.feedbacks.slice(0, 3);
      
      // Add feedbacks from Firebase
      recentFeedbacks.forEach((feedback, index) => {
        console.log(`📝 Adding feedback ${index + 1}:`, feedback.name);
        
        const card = document.createElement('div');
        card.classList.add('feedback-card');
        
        // Format the date
        const date = new Date(feedback.created_at);
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        // Create star display
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
        
        // Add fade-in animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        feedbackList.appendChild(card);
        
        // Animate in
        setTimeout(() => {
          card.style.transition = 'all 0.5s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 200);
      });
      
      // Add "Show More" button if there are more than 3 feedbacks
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
        
        // Add with animation
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
  
  console.log('📤 Submitting feedback...');
  feedbackFormSubmitting = true;
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    // Get form data
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('messageText').value.trim();
    const rating = document.getElementById('rating').value;
    
    console.log('📋 Form data:', { name, email, messageLength: message.length, rating });
    
    // Basic validation
    if (!name || !email || !message || !rating) {
      alert('Please fill in all fields and select a rating');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Rating validation
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      alert('Rating must be between 1 and 5');
      return;
    }
    
    // Check Firebase availability
    if (!firebaseReady || !window.submitFeedback) {
      alert('Database connection not ready. Please wait a moment and try again.');
      return;
    }
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    console.log('🔄 Calling Firebase submitFeedback...');
    
    const data = await window.submitFeedback({
      name: name,
      email: email,
      message: message,
      rating: ratingNum
    });
    
    console.log('📤 Submit result:', data);
    
    if (data.success) {
      // Show success message
      console.log('✅ Feedback submitted successfully!');
      
      // Custom success alert with better styling
      showSuccessMessage('Thank you for your feedback!', 
        `Your ${ratingNum}-star review has been submitted successfully. We appreciate your input!`);
      
      // Reset form and stars
      form.reset();
      document.getElementById('rating').value = 5;
      updateStarDisplay(5);
      const ratingText = document.getElementById('rating-text');
      if (ratingText) {
        ratingText.textContent = '5 Stars - Excellent';
      }
      
      // Reload feedbacks to show the new one (with delay to allow Firebase sync)
      console.log('🔄 Reloading feedbacks after submission...');
      setTimeout(() => {
        loadFeedbacks();
      }, 1500);
      
    } else {
      console.error('❌ Feedback submission failed:', data.message);
      alert('Error submitting feedback: ' + data.message);
    }
    
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    alert('Error submitting feedback. Please check your internet connection and try again.');
  } finally {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    feedbackFormSubmitting = false;
  }
}

// Show custom success message
function showSuccessMessage(title, message) {
  // Create custom modal/alert
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
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 5000);
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

// Helper function to escape HTML to prevent XSS
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

// Utility function to format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Make some functions available globally for debugging
window.KATIPUDROID = {
  loadFeedbacks,
  firebaseReady: () => firebaseReady,
  testConnection: () => {
    console.log('🧪 Testing connection...');
    console.log('Firebase DB:', window.firebaseDb);
    console.log('Submit function:', window.submitFeedback);
    console.log('Get function:', window.getRecentFeedbacks);
    console.log('Ready state:', firebaseReady);
  }
};

// Log when script loads
console.log('🎮 KATIPUDROID index.js loaded successfully');

// Add smooth scrolling for anchor links
document.addEventListener('click', function(e) {
  if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
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

// Add loading state to page
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Page fully loaded');
});