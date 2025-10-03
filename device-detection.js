// Device Detection and Download Control
// This script detects the user's device and only allows Android downloads

// Function to detect the user's device
function detectDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Detect Android
  if (/android/i.test(userAgent)) {
    return {
      type: 'Android',
      allowed: true,
      icon: '🤖',
      message: 'Your Android device is compatible! Click below to download the game.'
    };
  }
  
  // Detect iOS (iPhone, iPad, iPod)
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return {
      type: 'iOS',
      allowed: false,
      icon: '🍎',
      message: 'Sorry, KATIPUDROID is currently only available for Android devices. iOS version coming soon!'
    };
  }
  
  // Detect Windows
  if (/Windows/i.test(userAgent)) {
    return {
      type: 'Windows PC',
      allowed: false,
      icon: '💻',
      message: 'KATIPUDROID is designed for mobile devices only. Please download it on your Android phone or tablet.'
    };
  }
  
  // Detect Mac
  if (/Mac/i.test(userAgent)) {
    return {
      type: 'Mac',
      allowed: false,
      icon: '🖥️',
      message: 'KATIPUDROID is designed for mobile devices only. Please download it on your Android phone or tablet.'
    };
  }
  
  // Detect Linux
  if (/Linux/i.test(userAgent) && !/android/i.test(userAgent)) {
    return {
      type: 'Linux PC',
      allowed: false,
      icon: '🐧',
      message: 'KATIPUDROID is designed for mobile devices only. Please download it on your Android phone or tablet.'
    };
  }
  
  // Unknown device
  return {
    type: 'Unknown Device',
    allowed: false,
    icon: '❓',
    message: 'We could not detect your device type. KATIPUDROID is only available for Android devices.'
  };
}

// Function to show popup
function showDevicePopup(deviceInfo) {
  // Remove existing popup if any
  const existingPopup = document.getElementById('device-popup-overlay');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create popup HTML
  const popupHTML = `
    <div id="device-popup-overlay" class="device-popup-overlay show">
      <div class="device-popup">
        <button class="popup-close" onclick="closeDevicePopup()">
          <i class="fas fa-times"></i>
        </button>
        
        <div class="popup-icon ${deviceInfo.allowed ? 'success' : 'error'}">
          ${deviceInfo.icon}
        </div>
        
        <h2 class="popup-title">
          ${deviceInfo.allowed ? 'Ready to Download!' : 'For Android Devices Only'}
        </h2>
        
        <p class="popup-message">
          ${deviceInfo.message}
        </p>
        
        <div class="device-info">
          <p><strong>Detected Device:</strong> ${deviceInfo.type}</p>
          <p><strong>Status:</strong> ${deviceInfo.allowed ? '✅ Compatible' : '❌ Not Compatible'}</p>
        </div>
        
        <div class="popup-buttons">
          ${deviceInfo.allowed ? `
            <a href="katipudroid.apk" download class="popup-btn popup-btn-primary">
              <i class="fas fa-download"></i>
              Download APK
            </a>
          ` : `
            <button class="popup-btn popup-btn-primary" onclick="showQRCode()">
              <i class="fas fa-qrcode"></i>
              Show QR Code
            </button>
          `}
          <button class="popup-btn popup-btn-secondary" onclick="closeDevicePopup()">
            <i class="fas fa-times"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add popup to body
  document.body.insertAdjacentHTML('beforeend', popupHTML);
  
  // Prevent body scroll when popup is open
  document.body.style.overflow = 'hidden';
}

// Function to close popup
function closeDevicePopup() {
  const popup = document.getElementById('device-popup-overlay');
  if (popup) {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
      document.body.style.overflow = 'auto';
    }, 300);
  }
}

// Function to show QR code page (for non-Android users)
function showQRCode() {
  closeDevicePopup();
  window.location.href = 'qr-code.html';
}

// Function to handle download button click
function handleDownloadClick(event) {
  event.preventDefault();
  
  console.log('🎮 Download button clicked');
  
  // Detect device
  const deviceInfo = detectDevice();
  console.log('📱 Detected device:', deviceInfo);
  
  // Show popup
  showDevicePopup(deviceInfo);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎮 Device detection initialized');
  
  // Get the download button
  const downloadBtn = document.getElementById('download-btn');
  
  if (downloadBtn) {
    // Add click event listener
    downloadBtn.addEventListener('click', handleDownloadClick);
    console.log('✅ Download button listener added');
  } else {
    console.error('❌ Download button not found');
  }
});

// Close popup when clicking outside
document.addEventListener('click', function(event) {
  const popup = document.getElementById('device-popup-overlay');
  if (popup && event.target === popup) {
    closeDevicePopup();
  }
});

// Close popup with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeDevicePopup();
  }
});

// Log device info on page load (for debugging)
console.log('🔍 User Agent:', navigator.userAgent);
console.log('📱 Device Info:', detectDevice());