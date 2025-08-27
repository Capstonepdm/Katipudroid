<?php
// feedback_handler.php - FINAL CORRECTED VERSION

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// POST - Submit feedback
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $message = trim($input['message'] ?? '');
    $rating = intval($input['rating'] ?? 5);

    if (empty($name) || empty($email) || empty($message)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }

    if ($rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5']);
        exit;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO feedbacks (name, email, message, rating) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$name, $email, $message, $rating])) {
            echo json_encode([
                'success' => true, 
                'message' => 'Feedback submitted successfully!',
                'id' => $conn->lastInsertId()
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to submit feedback']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// GET - Fetch feedbacks
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT id, name, message, rating, created_at FROM feedbacks ORDER BY created_at DESC LIMIT 10");
        $stmt->execute();
        $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($feedbacks as &$feedback) {
            $feedback['formatted_date'] = date('M j, Y', strtotime($feedback['created_at']));
            $feedback['rating'] = intval($feedback['rating']) ?: 5; // Default to 5 if null
        }

        echo json_encode([
            'success' => true,
            'feedbacks' => $feedbacks,
            'count' => count($feedbacks)
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>