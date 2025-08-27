<?php
// get_all_feedbacks.php - Get all feedbacks for the feedbacks page

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Initialize database connection
$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

try {
    // Get all feedbacks (no limit for the feedbacks page)
    $query = "SELECT id, name, email, message, rating, created_at, status 
              FROM feedbacks 
              WHERE status != 'deleted' OR status IS NULL
              ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $feedbacks = $stmt->fetchAll();
    
    // Add some computed fields for better frontend handling
    foreach ($feedbacks as &$feedback) {
        // Format created_at for better display
        $feedback['formatted_date'] = date('M j, Y g:i A', strtotime($feedback['created_at']));
        
        // Add character count for the message
        $feedback['message_length'] = strlen($feedback['message']);
        
        // Ensure rating is an integer, default to 5 if null
        $feedback['rating'] = intval($feedback['rating']) ?: 5;
        
        // Don't send email to frontend for privacy
        unset($feedback['email']);
    }
    
    echo json_encode([
        'success' => true,
        'feedbacks' => $feedbacks,
        'total_count' => count($feedbacks),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching feedbacks: ' . $e->getMessage()
    ]);
}
?>