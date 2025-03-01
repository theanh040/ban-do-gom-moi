<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['name']) || !isset($data['email']) || !isset($data['message'])) {
    echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ."]);
    exit;
}

try {
    $name = $conn->real_escape_string($data['name']);
    $email = $conn->real_escape_string($data['email']);
    $phone = $conn->real_escape_string($data['phone'] ?? '');
    $message = $conn->real_escape_string($data['message']);

    // Lấy user_id từ localStorage (giả sử gửi qua request hoặc từ session)
    $user_id = null;
    if (isset($data['user_id']) && !empty($data['user_id']) && is_numeric($data['user_id'])) {
        $user_id = intval($data['user_id']);
        // Kiểm tra user_id có tồn tại không
        $checkUser = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
        $checkUser->bind_param("i", $user_id);
        $checkUser->execute();
        $result = $checkUser->get_result();
        if ($result->num_rows === 0) {
            $user_id = null; // Nếu user_id không tồn tại, để NULL
        }
        $checkUser->close();
    }

    $stmt = $conn->prepare("INSERT INTO contacts (user_id, name, email, phone, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("issss", $user_id, $name, $email, $phone, $message);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Gửi liên hệ thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Gửi liên hệ thất bại."]);
    }
} catch (Exception $e) {
    error_log("Lỗi: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi khi gửi liên hệ: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>