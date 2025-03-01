<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods:  DELETE, OPTIONS");
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

// Nhận order_id từ URL
$order_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : 0;

if ($order_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Order ID không hợp lệ."]);
    exit;
}

try {
    // Xóa đơn hàng
    $sql = "DELETE FROM orders WHERE order_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn SQL: " . $conn->error);
    }

    $stmt->bind_param("i", $order_id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Đơn hàng không tồn tại hoặc không thể xóa."]);
        exit;
    }

    // Xóa các mục liên quan trong order_items (do có ON DELETE CASCADE)
    echo json_encode(["success" => true, "message" => "Xóa đơn hàng thành công!"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}