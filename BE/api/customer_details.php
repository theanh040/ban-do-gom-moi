<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

// Kiểm tra nếu là request OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include("../config/db.php");

// Kiểm tra kết nối database
if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Không thể kết nối database."]);
    exit;
}

try {
    // Kiểm tra tham số id
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Thiếu hoặc không hợp lệ tham số id"]);
        exit;
    }

    $user_id = $conn->real_escape_string($_GET['id']);

    // Lấy thông tin khách hàng
    $sql = "SELECT user_id, username, email, role, created_at 
            FROM users 
            WHERE user_id = '$user_id'";
    $result = $conn->query($sql);

    if (!$result || $result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Khách hàng không tồn tại"]);
        exit;
    }

    $customer = $result->fetch_assoc();
    $customer = [
        "user_id" => (int)$customer['user_id'],
        "username" => $customer['username'],
        "email" => $customer['email'],
        "role" => $customer['role'],
        "created_at" => $customer['created_at']
    ];

    // Trả về dữ liệu
    echo json_encode($customer);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>