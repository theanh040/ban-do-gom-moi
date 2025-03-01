<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
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

try {
    // Lấy tham số tìm kiếm và lọc
    $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
    $status = isset($_GET['status']) ? $conn->real_escape_string($_GET['status']) : '';

    // Truy vấn để lấy danh sách đơn hàng
    $sql = "SELECT o.order_id, o.user_id, o.total_price, o.order_status, o.order_date 
            FROM orders o 
            WHERE 1=1";
    
    if ($search) {
        $sql .= " AND o.order_id LIKE '%$search%'";
    }
    if ($status) {
        $sql .= " AND o.order_status = '$status'";
    }

    $sql .= " ORDER BY o.order_date DESC LIMIT 50"; // Giới hạn 50 đơn hàng gần nhất

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Lỗi thực thi truy vấn SQL: " . $conn->error);
    }

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = [
            "order_id" => (int)$row['order_id'],
            "user_id" => (int)$row['user_id'],
            "total_price" => (float)$row['total_price'],
            "order_status" => $row['order_status'],
            "order_date" => $row['order_date']
        ];
    }

    echo json_encode($orders);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}