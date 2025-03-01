<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once "../config/db.php";

try {
    // Tính doanh thu tổng (tổng giá trị đơn hàng hoàn thành)
    $totalRevenueStmt = $conn->prepare("
        SELECT SUM(oi.quantity * p.price) AS total_revenue 
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.order_id 
        JOIN products p ON oi.product_id = p.product_id 
        WHERE o.order_status = 'completed'
    ");
    $totalRevenueStmt->execute();
    $totalRevenue = $totalRevenueStmt->get_result()->fetch_assoc()['total_revenue'] ?? 0;

    // Tính tổng đơn hàng (chỉ đơn hàng hoàn thành)
    $totalOrdersStmt = $conn->prepare("
        SELECT COUNT(DISTINCT o.order_id) AS total_orders 
        FROM orders o 
        WHERE o.order_status = 'completed'
    ");
    $totalOrdersStmt->execute();
    $totalOrders = $totalOrdersStmt->get_result()->fetch_assoc()['total_orders'] ?? 0;

    // Tính tổng sản phẩm đã bán (tổng quantity trong order_items của đơn hàng hoàn thành)
    $totalProductsSoldStmt = $conn->prepare("
        SELECT SUM(oi.quantity) AS total_products_sold 
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.order_id 
        WHERE o.order_status = 'completed'
    ");
    $totalProductsSoldStmt->execute();
    $totalProductsSold = $totalProductsSoldStmt->get_result()->fetch_assoc()['total_products_sold'] ?? 0;

    // Tính khách hàng mới (giả sử dựa trên đơn hàng hoàn thành trong khoảng thời gian gần đây, ví dụ: 30 ngày)
    $newCustomersStmt = $conn->prepare("
        SELECT COUNT(DISTINCT u.user_id) AS new_customers 
        FROM users u 
        JOIN orders o ON u.user_id = o.user_id 
        WHERE o.order_status = 'completed' 
        AND o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $newCustomersStmt->execute();
    $newCustomers = $newCustomersStmt->get_result()->fetch_assoc()['new_customers'] ?? 0;

    echo json_encode([
        "success" => true,
        "totalRevenue" => $totalRevenue,
        "totalOrders" => $totalOrders,
        "totalProductsSold" => $totalProductsSold,
        "newCustomers" => $newCustomers
    ]);
} catch (Exception $e) {
    error_log("Lỗi: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi khi lấy dữ liệu tổng quan: " . $e->getMessage()]);
} finally {
    if (isset($totalRevenueStmt)) $totalRevenueStmt->close();
    if (isset($totalOrdersStmt)) $totalOrdersStmt->close();
    if (isset($totalProductsSoldStmt)) $totalProductsSoldStmt->close();
    if (isset($newCustomersStmt)) $newCustomersStmt->close();
    if (isset($conn)) $conn->close();
}
?>