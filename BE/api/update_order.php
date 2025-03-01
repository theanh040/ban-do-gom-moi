<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: UPDATE, GET");
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
    // Lấy dữ liệu từ body
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['order_status'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dữ liệu không đầy đủ."]);
        exit;
    }

    $order_status = $data['order_status'];
    $valid_statuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!in_array($order_status, $valid_statuses)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Trạng thái không hợp lệ."]);
        exit;
    }

    // Cập nhật trạng thái đơn hàng
    $sql = "UPDATE orders SET order_status = ? WHERE order_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn SQL: " . $conn->error);
    }

    $stmt->bind_param("si", $order_status, $order_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Cập nhật trạng thái đơn hàng thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Không có thay đổi nào được thực hiện."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}