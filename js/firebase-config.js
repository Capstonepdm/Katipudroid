// js/firebase-config.js - Firebase configuration and setup

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
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration
// Replace with your actual Firebase config from Firebase Console
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

// Initialize Firestore
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
  serverTimestamp
};

console.log('Firebase initialized successfully');

// Helper function to submit feedback
window.submitFeedback = async function(feedbackData) {
  try {
    const docRef = await addDoc(collection(db, 'feedbacks'), {
      name: feedbackData.name.trim(),
      email: feedbackData.email.trim(), 
      message: feedbackData.message.trim(),
      rating: parseInt(feedbackData.rating),
      createdAt: serverTimestamp(),
      status: 'new',
      ipAddress: null, // Can't get IP on client-side
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

// Helper function to get all feedbacks
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

// Helper function to get recent feedbacks (for home page)
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

// Real-time listener for feedbacks
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

// Utility function to format dates
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