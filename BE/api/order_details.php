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

    $order_id = $conn->real_escape_string($_GET['id']);

    // Lấy thông tin đơn hàng
    $sql = "SELECT o.order_id, o.user_id, u.username, o.total_price, o.order_status, o.order_date 
            FROM orders o 
            JOIN users u ON o.user_id = u.user_id 
            WHERE o.order_id = '$order_id'";
    $result = $conn->query($sql);

    if (!$result || $result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Đơn hàng không tồn tại"]);
        exit;
    }

    $order = $result->fetch_assoc();
    $order = [
        "order_id" => (int)$order['order_id'],
        "user_id" => (int)$order['user_id'],
        "username" => $order['username'],
        "total_price" => (float)$order['total_price'],
        "order_status" => $order['order_status'],
        "order_date" => $order['order_date']
    ];

    // Lấy danh sách sản phẩm trong đơn hàng (sửa cột name thành product_name)
    $sql_items = "SELECT oi.product_id, p.product_name AS product_name, oi.quantity, oi.price 
                  FROM order_items oi 
                  JOIN products p ON oi.product_id = p.product_id 
                  WHERE oi.order_id = '$order_id'";
    $items_result = $conn->query($sql_items);

    if (!$items_result) {
        throw new Exception("Lỗi truy vấn chi tiết sản phẩm: " . $conn->error);
    }

    $items = [];
    while ($item = $items_result->fetch_assoc()) {
        $items[] = [
            "product_id" => (int)$item['product_id'],
            "product_name" => $item['product_name'],
            "quantity" => (int)$item['quantity'],
            "price" => (float)$item['price']
        ];
    }

    // Gắn items vào order
    $order['items'] = $items;

    // Trả về dữ liệu
    echo json_encode($order);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>