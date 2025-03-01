<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:\xampp\php\logs\php_error.log');

require_once "../config/db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Accept");

$input = file_get_contents("php://input");
$data = json_decode($input, true);

$user_id = $data["user_id"] ?? null;

if (!$user_id || !is_numeric($user_id)) {
    echo json_encode(["success" => false, "message" => "User ID không hợp lệ."]);
    exit;
}

$user_id = (int)$user_id;

try {
    // Kiểm tra user tồn tại
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Người dùng không tồn tại."]);
        exit;
    }

    // Lấy đơn hàng pending của user
    $stmt = $conn->prepare("SELECT order_id, total_price FROM orders WHERE user_id = ? AND order_status = 'pending'");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Không có giỏ hàng để thanh toán."]);
        exit;
    }

    $order = $result->fetch_assoc();
    $order_id = $order["order_id"];

    // Cập nhật trạng thái đơn hàng thành 'completed'
    $stmt = $conn->prepare("UPDATE orders SET order_status = 'completed', order_date = NOW() WHERE order_id = ?");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();

    // (Tùy chọn) Lưu lịch sử đơn hàng vào bảng khác (nếu cần)
    /*
    $stmt = $conn->prepare("INSERT INTO order_history (order_id, user_id, total_price, order_status, order_date) 
                           SELECT order_id, user_id, total_price, 'completed', NOW() 
                           FROM orders WHERE order_id = ?");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    */

    // Xóa đơn hàng pending (nếu không cần giữ lại)
    $stmt = $conn->prepare("DELETE FROM orders WHERE order_id = ? AND order_status = 'completed'");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();

    // Xóa các mục trong order_items liên quan
    $stmt = $conn->prepare("DELETE FROM order_items WHERE order_id = ?");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();

    echo json_encode(["success" => true, "message" => "Thanh toán thành công!"]);
} catch (Exception $e) {
    error_log("Lỗi: " + $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi thanh toán: " + $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>