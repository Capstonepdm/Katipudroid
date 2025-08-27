// index.js 

// Owl Carousel initialization
$(document).ready(function () {
  $(".custom-carousel").owlCarousel({
    autoWidth: true,
    loop: true
  });

  $(".custom-carousel .item").click(function () {
    $(".custom-carousel .item").not($(this)).removeClass("active");
    $(this).toggleClass("active");
  });

  // Load existing feedbacks when page loads
  loadFeedbacks();
  
  // Initialize star rating
  initializeStarRating();
});

// Initialize star rating functionality
function initializeStarRating() {
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
  
  // Set default rating to 5 stars
  updateStarDisplay(5);
  ratingInput.value = 5;
  if (ratingText) ratingText.textContent = ratingLabels[5];
  
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      ratingInput.value = rating;
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
  document.getElementById('star-rating').addEventListener('mouseleave', function() {
    const currentRating = parseInt(ratingInput.value);
    updateStarDisplay(currentRating);
    if (ratingText) ratingText.textContent = ratingLabels[currentRating];
  });
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

// Load recent feedbacks from database (limit to 3 for home page)
async function loadFeedbacks() {
  try {
    const response = await fetch('src/feedback_handler.php', {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (data.success && data.feedbacks) {
      const feedbackList = document.getElementById('feedback-list');
      
      // Clear existing static feedbacks
      feedbackList.innerHTML = '';
      
      // Show only first 3 feedbacks on home page
      const recentFeedbacks = data.feedbacks.slice(0, 3);
      
      // Add feedbacks from database
      recentFeedbacks.forEach(feedback => {
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
          <h4>${escapeHtml(feedback.name)} <small style="color: #999; font-size: 0.8em;">(${formattedDate})</small></h4>
          <p>${escapeHtml(feedback.message)}</p>
        `;
        feedbackList.appendChild(card);
      });
      
      // Add "Show More" button if there are more than 3 feedbacks
      if (data.feedbacks.length > 3) {
        const showMoreBtn = document.createElement('div');
        showMoreBtn.classList.add('feedback-card', 'show-more-card');
        showMoreBtn.innerHTML = `
          <div style="text-align: center; padding: 1rem;">
            <i class="fas fa-plus-circle" style="font-size: 2rem; color: #ff4655; margin-bottom: 0.5rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">View All Feedbacks</h4>
            <p style="margin-bottom: 1rem; color: #ccc;">See all ${data.feedbacks.length} feedbacks from our community</p>
            <a href="src/feedbacks.html" class="download-btn" style="display: inline-block; text-decoration: none; font-size: 1rem; padding: 0.6rem 1.2rem;">
              Show More <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        `;
        feedbackList.appendChild(showMoreBtn);
      }
    }
  } catch (error) {
    console.error('Error loading feedbacks:', error);
  }
}

// Submit feedback to database
document.getElementById('feedback-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('messageText').value;
  const rating = document.getElementById('rating').value;
  
  // Basic validation
  if (!name || !email || !message || !rating) {
    alert('Please fill in all fields and select a rating');
    return;
  }
  
  try {
    const response = await fetch('src/feedback_handler.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        email: email,
        message: message,
        rating: parseInt(rating)
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert('Thank you for your feedback and rating!');
      
      // Reset form and stars
      document.getElementById('feedback-form').reset();
      document.getElementById('rating').value = 5;
      updateStarDisplay(5);
      if (document.getElementById('rating-text')) {
        document.getElementById('rating-text').textContent = '5 Stars - Excellent';
      }
      
      // Reload feedbacks to show the new one
      loadFeedbacks();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    alert('Error submitting feedback. Please try again.');
  }
});

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

// Mobile menu toggle
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');
menuToggle.addEventListener('click', () => {
  navbar.classList.toggle('active');
});