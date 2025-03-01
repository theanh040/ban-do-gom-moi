<?php
// Bật CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
    // Truy vấn để tính doanh thu theo ngày
    $sql = "
        SELECT 
            DATE(o.order_date) AS date,
            SUM(oi.quantity * oi.price) AS revenue,
            COUNT(DISTINCT o.order_id) AS orders,
            SUM(oi.quantity) AS products_sold
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_status IN ('completed', 'shipped')
        GROUP BY DATE(o.order_date)
        ORDER BY DATE(o.order_date) DESC
        LIMIT 7"; // Lấy 7 ngày gần nhất

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Lỗi thực thi truy vấn SQL: " . $conn->error);
    }

    $dailyRevenue = [];
    while ($row = $result->fetch_assoc()) {
        $dailyRevenue[] = [
            "date" => $row['date'],
            "revenue" => (float)$row['revenue'],
            "orders" => (int)$row['orders'],
            "products_sold" => (int)$row['products_sold']
        ];
    }

    echo json_encode($dailyRevenue);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}