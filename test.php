<?php
// test.php - Quick test

echo "<h2>Testing Database Connection</h2>";

try {
    $pdo = new PDO('mysql:host=localhost;dbname=katipudroid_db', 'root', '');
    echo "✅ Direct connection works!<br>";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM feedbacks");
    $count = $stmt->fetchColumn();
    echo "✅ Found $count feedbacks in database<br>";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

echo "<hr>";
echo "<h3>Testing config.php</h3>";

require_once 'src/config.php';
$database = new Database();
$conn = $database->getConnection();

if ($conn) {
    echo "✅ Config.php works!<br>";
} else {
    echo "❌ Config.php failed!<br>";
}
?>