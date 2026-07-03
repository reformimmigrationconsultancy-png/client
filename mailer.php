<?php
/**
 * PHP MAILER API SCRIPT
 * 
 * INSTRUCTIONS:
 * 1. Upload this file (mailer.php) to your PHP Hosting / cPanel (inside public_html).
 * 2. Get the URL to this file (e.g., https://yourdomain.com/mailer.php).
 * 3. Go to your Render Dashboard -> Environment Variables.
 * 4. Add a new variable: PHP_MAILER_URL
 * 5. Set its value to the URL from step 2.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $to = $data['to'] ?? '';
    $subject = $data['subject'] ?? '';
    $message = $data['html'] ?? $data['text'] ?? '';
    $from = $data['from'] ?? 'alerts@manpreetcrm.com';
    $fromName = $data['fromName'] ?? 'Lead CRM';

    if (empty($to) || empty($subject) || empty($message)) {
        echo json_encode(["success" => false, "message" => "Missing required fields (to, subject, html/text)"]);
        exit;
    }

    $headers = "From: " . $fromName . " <" . $from . ">\r\n";
    $headers .= "Reply-To: " . $from . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    if (mail($to, $subject, $message, $headers)) {
        echo json_encode(["success" => true, "message" => "Email sent successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "PHP mail() function failed to send email"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?>
