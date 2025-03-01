<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
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
    // Lấy tham số lọc
    $period = isset($_GET['period']) ? $_GET['period'] : 'monthly';
    $date = isset($_GET['date']) ? date('Y-m-d', strtotime($_GET['date'])) : date('Y-m-d');

    
    // Xây dựng truy vấn dựa trên period
    $sql = "";
    if ($period === 'daily') {
        $sql = "SELECT DATE(o.order_date) AS period, 
                SUM(oi.quantity * oi.price) AS revenue, 
                COUNT(DISTINCT o.order_id) AS orders, 
                SUM(oi.quantity) AS products_sold, 
                COUNT(DISTINCT o.user_id) AS customers 
                FROM orders o 
                JOIN order_items oi ON o.order_id = oi.order_id 
                WHERE o.order_status IN ('completed', 'shipped') 
                AND DATE(o.order_date) = ? 
                GROUP BY DATE(o.order_date)";
            $sql .= " ORDER BY period ASC";
    } elseif ($period === 'weekly') {
        $sql = "SELECT YEARWEEK(o.order_date) AS period, 
                SUM(oi.quantity * oi.price) AS revenue, 
                COUNT(DISTINCT o.order_id) AS orders, 
                SUM(oi.quantity) AS products_sold, 
                COUNT(DISTINCT o.user_id) AS customers 
                FROM orders o 
                JOIN order_items oi ON o.order_id = oi.order_id 
                WHERE o.order_status IN ('completed', 'shipped') 
                AND YEARWEEK(o.order_date) = YEARWEEK(?) 
                GROUP BY YEARWEEK(o.order_date)";
        $sql .= " ORDER BY period ASC";
    } elseif ($period === 'monthly') {
        $sql = "SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS period, 
                SUM(oi.quantity * oi.price) AS revenue, 
                COUNT(DISTINCT o.order_id) AS orders, 
                SUM(oi.quantity) AS products_sold, 
                COUNT(DISTINCT o.user_id) AS customers 
                FROM orders o 
                JOIN order_items oi ON o.order_id = oi.order_id 
                WHERE o.order_status IN ('completed', 'shipped') 
                AND DATE_FORMAT(o.order_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m') 
                GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')";
        $sql .= " ORDER BY period ASC";
    } elseif ($period === 'yearly') {
        $sql = "SELECT DATE_FORMAT(o.order_date, '%Y') AS period, 
                SUM(oi.quantity * oi.price) AS revenue, 
                COUNT(DISTINCT o.order_id) AS orders, 
                SUM(oi.quantity) AS products_sold, 
                COUNT(DISTINCT o.user_id) AS customers 
                FROM orders o 
                JOIN order_items oi ON o.order_id = oi.order_id 
                WHERE o.order_status IN ('completed', 'shipped') 
                AND DATE_FORMAT(o.order_date, '%Y') = DATE_FORMAT(?, '%Y') 
                GROUP BY DATE_FORMAT(o.order_date, '%Y')";
        $sql .= " ORDER BY period ASC";
    }

    if (empty($sql)) {
        throw new Exception("Thời gian báo cáo không hợp lệ.");
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn SQL: " . $conn->error);
    }

    $stmt->bind_param("s", $date);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        throw new Exception("Lỗi thực thi truy vấn SQL: " . $conn->error);
    }

    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $reports[] = [
            "period" => $row['period'],
            "revenue" => (float)$row['revenue'],
            "orders" => (int)$row['orders'],
            "products_sold" => (int)$row['products_sold'],
            "customers" => (int)$row['customers']
        ];
    }

    echo json_encode($reports);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
