// feedbacks.js - Complete version with all missing functions

let allFeedbacks = [];
let filteredFeedbacks = [];
let currentPage = 1;
const feedbacksPerPage = 12;
let realtimeUnsubscribe = null;

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait for Firebase to initialize
  setTimeout(() => {
    if (window.firebaseDb) {
      setupRealtimeListener();
    } else {
      console.error('Firebase not initialized');
      showError('Firebase not initialized. Please refresh the page.');
    }
  }, 1000);
  
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  const searchBox = document.getElementById('search-box');
  const sortSelect = document.getElementById('sort-select');
  const ratingFilter = document.getElementById('rating-filter');
  const menuToggle = document.getElementById('menu-toggle');
  const navbar = document.getElementById('navbar');

  // Search functionality
  if (searchBox) {
    searchBox.addEventListener('input', debounce(handleSearch, 300));
  }
  
  // Sort functionality
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSort);
  }
  
  // Rating filter functionality
  if (ratingFilter) {
    ratingFilter.addEventListener('change', handleRatingFilter);
  }
  
  // Mobile menu toggle
  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => {
      navbar.classList.toggle('active');
    });
  }
}

// Setup real-time listener for feedbacks
function setupRealtimeListener() {
  showLoading(true);
  
  try {
    if (!window.listenToFeedbacks) {
      console.error('Firebase listener function not available');
      showError('Firebase functions not available. Please refresh the page.');
      return;
    }

    // Set up real-time listener
    realtimeUnsubscribe = window.listenToFeedbacks((data) => {
      if (data.success) {
        allFeedbacks = data.feedbacks;
        filteredFeedbacks = [...allFeedbacks];
        updateStats();
        calculateRatingSummary();
        displayFeedbacks();
        setupPagination();
        showLoading(false);
        
        // Show a subtle notification for new feedback (optional)
        if (allFeedbacks.length > 0) {
          console.log(`Real-time update: ${allFeedbacks.length} feedbacks loaded`);
        }
      } else {
        showError('Failed to load feedbacks: ' + data.message);
      }
    });
  } catch (error) {
    console.error('Error setting up real-time listener:', error);
    showError('Error setting up real-time updates. Please refresh the page.');
  }
}

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
  if (realtimeUnsubscribe) {
    realtimeUnsubscribe();
  }
});

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Show/hide loading spinner
function showLoading(show) {
  const spinner = document.getElementById('loading-spinner');
  const grid = document.getElementById('feedbacks-grid');
  const pagination = document.getElementById('pagination-controls');
  
  if (spinner && grid) {
    if (show) {
      spinner.style.display = 'block';
      grid.style.display = 'none';
      if (pagination) pagination.style.display = 'none';
    } else {
      spinner.style.display = 'none';
      grid.style.display = 'grid';
    }
  }
}

// Show error message
function showError(message) {
  const grid = document.getElementById('feedbacks-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="no-feedbacks" style="grid-column: 1/-1;">
        <i class="fas fa-exclamation-triangle fa-3x" style="margin-bottom: 1rem; color: #ff4655;"></i>
        <h3>Error Loading Feedbacks</h3>
        <p>${message}</p>
        <button class="back-button" onclick="location.reload()" style="margin-top: 1rem;">
          <i class="fas fa-refresh"></i>
          Try Again
        </button>
      </div>
    `;
  }
}

// Update statistics
function updateStats() {
  const totalElement = document.getElementById('total-feedbacks');
  if (totalElement) {
    totalElement.textContent = allFeedbacks.length;
  }
}

// Handle search
function handleSearch() {
  applyFilters();
}

// Handle rating filter
function handleRatingFilter() {
  applyFilters();
}

// Apply all filters (search + rating)
function applyFilters() {
  const searchBox = document.getElementById('search-box');
  const ratingFilter = document.getElementById('rating-filter');
  
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : '';
  const ratingFilterValue = ratingFilter ? ratingFilter.value : 'all';
  
  let filtered = [...allFeedbacks];
  
  // Apply search filter
  if (searchTerm !== '') {
    filtered = filtered.filter(feedback => 
      feedback.name.toLowerCase().includes(searchTerm) ||
      feedback.message.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply rating filter
  if (ratingFilterValue !== 'all') {
    const targetRating = parseInt(ratingFilterValue);
    filtered = filtered.filter(feedback => 
      (feedback.rating || 5) === targetRating
    );
  }
  
  filteredFeedbacks = filtered;
  currentPage = 1;
  displayFeedbacks();
  setupPagination();
  
  // Update stats to show filtered count
  updateFilteredStats();
}

// Update stats for filtered results
function updateFilteredStats() {
  const totalElement = document.getElementById('total-feedbacks');
  const searchBox = document.getElementById('search-box');
  const ratingFilter = document.getElementById('rating-filter');
  
  if (totalElement) {
    const searchTerm = searchBox ? searchBox.value.trim() : '';
    const ratingFilterValue = ratingFilter ? ratingFilter.value : 'all';
    
    if (searchTerm || ratingFilterValue !== 'all') {
      totalElement.textContent = `${filteredFeedbacks.length} of ${allFeedbacks.length}`;
    } else {
      totalElement.textContent = allFeedbacks.length;
    }
  }
}

// Handle sorting
function handleSort() {
  const sortSelect = document.getElementById('sort-select');
  if (!sortSelect) return;
  
  const sortValue = sortSelect.value;
  
  switch (sortValue) {
    case 'newest':
      filteredFeedbacks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'oldest':
      filteredFeedbacks.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'highest':
      filteredFeedbacks.sort((a, b) => (b.rating || 5) - (a.rating || 5));
      break;
    case 'lowest':
      filteredFeedbacks.sort((a, b) => (a.rating || 5) - (b.rating || 5));
      break;
    case 'name':
      filteredFeedbacks.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  
  currentPage = 1;
  displayFeedbacks();
  setupPagination();
}

// Display feedbacks for current page
function displayFeedbacks() {
  const grid = document.getElementById('feedbacks-grid');
  const noFeedbacks = document.getElementById('no-feedbacks');
  
  if (!grid) return;
  
  if (filteredFeedbacks.length === 0) {
    grid.style.display = 'none';
    if (noFeedbacks) noFeedbacks.style.display = 'block';
    return;
  }
  
  if (noFeedbacks) noFeedbacks.style.display = 'none';
  grid.style.display = 'grid';
  
  const startIndex = (currentPage - 1) * feedbacksPerPage;
  const endIndex = startIndex + feedbacksPerPage;
  const feedbacksToShow = filteredFeedbacks.slice(startIndex, endIndex);
  
  grid.innerHTML = feedbacksToShow.map(feedback => createFeedbackCard(feedback)).join('');
}

// Create HTML for a single feedback card
function createFeedbackCard(feedback) {
  const initials = getInitials(feedback.name);
  const formattedDate = formatDate(feedback.created_at);
  const timeAgo = getTimeAgo(feedback.created_at);
  const rating = feedback.rating || 5;
  const stars = createStarDisplay(rating);
  
  return `
    <div class="feedback-card-enhanced">
      <div class="feedback-header">
        <div class="feedback-author">
          <div class="author-avatar">${initials}</div>
          <div class="author-info">
            <h4>${escapeHtml(feedback.name)}</h4>
          </div>
        </div>
        <div class="feedback-date">
          <i class="fas fa-clock"></i>
          ${timeAgo}
        </div>
      </div>
      <div class="feedback-rating">
        <div class="feedback-stars">${stars}</div>
        <span class="rating-text">${rating}/5</span>
      </div>
      <div class="feedback-message">
        ${escapeHtml(feedback.message)}
      </div>
      <div class="feedback-id">
        #${feedback.id} • ${formattedDate}
      </div>
    </div>
  `;
}

// Get initials from name
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get time ago string
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}

// Setup pagination
function setupPagination() {
  const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);
  const paginationControls = document.getElementById('pagination-controls');
  const paginationInfo = document.getElementById('pagination-info');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (!paginationControls) return;
  
  if (totalPages <= 1) {
    paginationControls.style.display = 'none';
    return;
  }
  
  paginationControls.style.display = 'flex';
  if (paginationInfo) {
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// Change page
function changePage(direction) {
  const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);
  const newPage = currentPage + direction;
  
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    displayFeedbacks();
    setupPagination();
    
    // Scroll to top of feedbacks
    const grid = document.getElementById('feedbacks-grid');
    if (grid) {
      grid.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

// Make changePage available globally
window.changePage = changePage;

// Calculate and display rating summary
function calculateRatingSummary() {
  if (allFeedbacks.length === 0) return;
  
  const ratingSummary = document.getElementById('rating-summary');
  const avgStars = document.getElementById('avg-stars');
  const avgRatingText = document.getElementById('avg-rating-text');
  const ratingDistribution = document.getElementById('rating-distribution');
  
  if (!ratingSummary || !avgStars || !avgRatingText || !ratingDistribution) return;
  
  // Calculate average rating
  const totalRating = allFeedbacks.reduce((sum, feedback) => sum + (feedback.rating || 5), 0);
  const avgRating = (totalRating / allFeedbacks.length).toFixed(1);
  
  // Count ratings distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allFeedbacks.forEach(feedback => {
    const rating = feedback.rating || 5;
    distribution[rating]++;
  });
  
  // Display average rating stars
  avgStars.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'avg-star';
    star.textContent = '★';
    if (i <= Math.round(avgRating)) {
      star.classList.add('filled');
    }
    avgStars.appendChild(star);
  }
  
  avgRatingText.textContent = avgRating;
  
  // Display distribution
  const distributionText = Object.entries(distribution)
    .reverse()
    .map(([rating, count]) => `${rating}★: ${count}`)
    .join(' | ');
  
  ratingDistribution.textContent = distributionText;
  ratingSummary.style.display = 'block';
}

// Create star display for ratings
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

// Escape HTML to prevent XSS
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