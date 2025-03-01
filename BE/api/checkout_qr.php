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
$amount = $data["amount"] ?? null;

if (!$user_id || !is_numeric($user_id) || !$amount || !is_numeric($amount)) {
    echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ."]);
    exit;
}

$user_id = (int)$user_id;
$amount = (float)$amount;

try {
    // Kiểm tra user tồn tại
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Người dùng không tồn tại."]);
        exit;
    }

    // Lấy đơn hàng pending
    $stmt = $conn->prepare("SELECT order_id, total_price FROM orders WHERE user_id = ? AND order_status = 'pending'");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Không có giỏ hàng để thanh toán."]);
        exit;
    }

    $order = $result->fetch_assoc();
    if ($order["total_price"] !== $amount) {
        echo json_encode(["success" => false, "message" => "Số tiền không khớp với đơn hàng."]);
        exit;
    }

    $order_id = $order["order_id"];

    // Giả lập kiểm tra giao dịch QR (vì mã QR tĩnh không tự động cập nhật, bạn cần kiểm tra thủ công hoặc qua API VietQR)
    /*
    $transactionCheck = checkVietQRTransaction($order_id, $amount);
    if (!$transactionCheck) {
        echo json_encode(["success" => false, "message" => "Giao dịch QR chưa hoàn tất. Vui lòng kiểm tra lại."]);
        exit;
    }
    */

    // Tạo hoặc cập nhật đơn hàng trong bảng orders_history (nếu cần)
    $stmt = $conn->prepare("INSERT INTO order_history (user_id, order_id, total_price, payment_method, order_status, order_date) 
                           VALUES (?, ?, ?, 'qr', 'completed', NOW())
                           ON DUPLICATE KEY UPDATE total_price = ?, payment_method = 'qr', order_status = 'completed', order_date = NOW()");
    $stmt->bind_param("iidd", $user_id, $order_id, $amount, $amount);
    $stmt->execute();

    // Cập nhật trạng thái đơn hàng thành 'completed' với phương thức QR
    $stmt = $conn->prepare("UPDATE orders SET order_status = 'completed', payment_method = 'qr', order_date = NOW() WHERE order_id = ?");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();

    // Xóa đơn hàng pending sau khi hoàn tất
    $stmt = $conn->prepare("DELETE FROM orders WHERE order_id = ? AND order_status = 'completed'");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();

    // Xóa các mục trong order_items
    $stmt = $conn->prepare("DELETE FROM order_items WHERE order_id = ?");
    $stmt->bind_param("i", $order_id);
    $stmt->execute();

    echo json_encode(["success" => true, "message" => "Thanh toán qua mã QR thành công!"]);
} catch (Exception $e) {
    error_log("Lỗi: " + $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi thanh toán QR: " + $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}

// Hàm giả lập kiểm tra giao dịch QR (cần tích hợp API VietQR thực tế)
function checkVietQRTransaction($orderId, $amount) {
    // Đây là giả lập, bạn cần gọi API VietQR Transaction Sync để kiểm tra giao dịch thực tế
    return true; // Giả lập giao dịch thành công
}