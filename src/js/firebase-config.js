// js/firebase-config.js - Updated with OTP support

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  where,
  deleteDoc,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmIbRpVMx77Sr8rDHW2cegaiWt0FinvyM",
  authDomain: "katipudroid-40690.firebaseapp.com",
  projectId: "katipudroid-40690",
  storageBucket: "katipudroid-40690.firebasestorage.app",
  messagingSenderId: "517246659517",
  appId: "1:517246659517:web:517014582e93227ac8c0d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export for use in other files
window.firebaseApp = app;
window.firebaseDb = db;
window.firebaseModules = {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  where,
  deleteDoc,
  doc,
  getDoc
};

console.log('Firebase initialized successfully');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in Firebase with expiration
window.storeOTP = async function(email, otp) {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expires in 10 minutes
    
    const docRef = await addDoc(collection(db, 'otps'), {
      email: email.toLowerCase().trim(),
      otp: otp,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt,
      verified: false
    });
    
    return {
      success: true,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error storing OTP:', error);
    return {
      success: false,
      message: 'Error storing OTP: ' + error.message
    };
  }
};

// Verify OTP
window.verifyOTP = async function(email, otp) {
  try {
    const q = query(
      collection(db, 'otps'), 
      where('email', '==', email.toLowerCase().trim()),
      where('otp', '==', otp),
      where('verified', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Invalid OTP code'
      };
    }
    
    // Check if OTP is expired
    const otpDoc = querySnapshot.docs[0];
    const otpData = otpDoc.data();
    const now = new Date();
    const expiresAt = otpData.expiresAt.toDate();
    
    if (now > expiresAt) {
      // Delete expired OTP
      await deleteDoc(doc(db, 'otps', otpDoc.id));
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }
    
    // Mark OTP as verified
    await deleteDoc(doc(db, 'otps', otpDoc.id));
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Error verifying OTP: ' + error.message
    };
  }
};

// Clean up expired OTPs (call this periodically)
window.cleanupExpiredOTPs = async function() {
  try {
    const q = query(collection(db, 'otps'));
    const querySnapshot = await getDocs(q);
    const now = new Date();
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.expiresAt && data.expiresAt.toDate() < now) {
        deletePromises.push(deleteDoc(doc.ref));
      }
    });
    
    await Promise.all(deletePromises);
    console.log(`Cleaned up ${deletePromises.length} expired OTPs`);
  } catch (error) {
    console.error('Error cleaning up OTPs:', error);
  }
};

// Helper function to submit feedback (unchanged)
window.submitFeedback = async function(feedbackData) {
  try {
    const docRef = await addDoc(collection(db, 'feedbacks'), {
      name: feedbackData.name.trim(),
      email: feedbackData.email.trim(), 
      message: feedbackData.message.trim(),
      rating: parseInt(feedbackData.rating),
      createdAt: serverTimestamp(),
      status: 'new',
      ipAddress: null,
      userAgent: navigator.userAgent
    });
    
    return {
      success: true,
      message: 'Feedback submitted successfully!',
      id: docRef.id
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      message: 'Error submitting feedback: ' + error.message
    };
  }
};

// Send OTP Email using EmailJS
window.sendOTPEmail = async function(email, name, otp) {
  try {
    // Make sure EmailJS is loaded
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS not loaded');
    }
    
    // EmailJS template parameters - these must match your template variables
    const templateParams = {
      to_email: email,        // This is the recipient email
      to_name: name,          // This is the recipient name
      user_name: name,        // Alternative name field
      user_email: email,      // Alternative email field
      otp_code: otp,          // The OTP code
      reply_to: email         // Reply-to address
    };
    
    console.log('📧 Sending email with params:', {
      to_email: email,
      to_name: name,
      otp_code: otp
    });
    
    // Your actual EmailJS credentials
    const SERVICE_ID = 'service_802oicm';      // Your actual service ID
    const TEMPLATE_ID = 'template_qe8a1wo';    // Your actual template ID
    const PUBLIC_KEY = 'ym7yxfFUGxy4FAGDw';   // Your actual public key
    
    // Check if credentials are still placeholder values
    if (SERVICE_ID === 'YOUR_SERVICE_ID' || TEMPLATE_ID === 'YOUR_TEMPLATE_ID' || PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      throw new Error('Please update EmailJS credentials in firebase-config.js');
    }
    
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    
    console.log('✅ EmailJS response:', response);
    
    return {
      success: true,
      message: 'OTP sent successfully'
    };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      message: 'Failed to send OTP email: ' + (error.text || error.message || 'Unknown error')
    };
  }
};

// Generate and send OTP
window.generateAndSendOTP = async function(email, name) {
  try {
    const otp = generateOTP();
    
    // Store OTP in Firebase
    const storeResult = await window.storeOTP(email, otp);
    if (!storeResult.success) {
      return storeResult;
    }
    
    // Send OTP via email
    const emailResult = await window.sendOTPEmail(email, name, otp);
    
    return emailResult;
  } catch (error) {
    console.error('Error generating and sending OTP:', error);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
};

// Other existing functions remain the same...
window.getAllFeedbacks = async function() {
  try {
    const q = query(
      collection(db, 'feedbacks'), 
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const feedbacks = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      feedbacks.push({
        id: doc.id,
        name: data.name,
        message: data.message,
        rating: data.rating || 5,
        created_at: data.createdAt?.toDate?.() || new Date(),
        status: data.status || 'new',
        formatted_date: formatDate(data.createdAt?.toDate?.() || new Date()),
        message_length: data.message.length
      });
    });
    
    return {
      success: true,
      feedbacks: feedbacks,
      total_count: feedbacks.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting feedbacks:', error);
    return {
      success: false,
      message: 'Error fetching feedbacks: ' + error.message
    };
  }
};

window.getRecentFeedbacks = async function(limitCount = 10) {
  try {
    const q = query(
      collection(db, 'feedbacks'), 
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const feedbacks = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      feedbacks.push({
        id: doc.id,
        name: data.name,
        message: data.message,
        rating: data.rating || 5,
        created_at: data.createdAt?.toDate?.() || new Date()
      });
    });
    
    return {
      success: true,
      feedbacks: feedbacks,
      count: feedbacks.length
    };
  } catch (error) {
    console.error('Error getting recent feedbacks:', error);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
};

window.listenToFeedbacks = function(callback) {
  const q = query(
    collection(db, 'feedbacks'), 
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const feedbacks = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      feedbacks.push({
        id: doc.id,
        name: data.name,
        message: data.message,
        rating: data.rating || 5,
        created_at: data.createdAt?.toDate?.() || new Date(),
        status: data.status || 'new',
        formatted_date: formatDate(data.createdAt?.toDate?.() || new Date()),
        message_length: data.message.length
      });
    });
    
    callback({
      success: true,
      feedbacks: feedbacks,
      total_count: feedbacks.length,
      timestamp: new Date().toISOString()
    });
  }, (error) => {
    console.error('Error listening to feedbacks:', error);
    callback({
      success: false,
      message: 'Error: ' + error.message
    });
  });
};

function formatDate(date) {
  if (!date) return 'Unknown date';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  window.cleanupExpiredOTPs();
}, 5 * 60 * 1000);