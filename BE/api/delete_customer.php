<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Kiểm tra nếu là request OPTIONS, dừng xử lý để trình duyệt không chặn
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

// Nhận user_id từ URL
$user_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : 0;

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID không hợp lệ."]);
    exit;
}

try {
    // Xóa khách hàng
    $sql = "DELETE FROM users WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn SQL: " . $conn->error);
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Khách hàng không tồn tại hoặc không thể xóa."]);
        exit;
    }

    // Xóa các đơn hàng và mục liên quan của khách hàng (do có ON DELETE CASCADE trong orders và order_items)
    echo json_encode(["success" => true, "message" => "Xóa khách hàng thành công!"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}