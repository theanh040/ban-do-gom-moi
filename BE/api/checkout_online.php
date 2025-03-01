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

    // Tích hợp cổng thanh toán (ví dụ: Stripe)
    // Đây là ví dụ giả lập, bạn cần cài đặt thư viện Stripe và thay thế
    /*
    \Stripe\Stripe::setApiKey('your_stripe_secret_key');
    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'vnd',
                'product_data' => ['name' => 'Đơn hàng Lạc Hồng Store'],
                'unit_amount' => $amount * 100, // Stripe dùng cent
            ],
            'quantity' => 1,
        ]],
        'mode' => 'payment',
        'success_url' => 'http://localhost:3000/FE/customer/views/cart.html?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => 'http://localhost:3000/FE/customer/views/checkout.html',
    ]);

    echo json_encode([
        "success" => true,
        "checkoutUrl" => $session->url,
        "message" => "Chuyển hướng đến cổng thanh toán online."
    ]);
    */

    // Giả lập trả về URL thanh toán (cho mục đích demo)
    echo json_encode([
        "success" => true,
        "checkoutUrl" => "https://example.com/payment?order_id=" . $order["order_id"],
        "message" => "Chuyển hướng đến cổng thanh toán online."
    ]);

} catch (Exception $e) {
    error_log("Lỗi: " + $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi thanh toán online: " + $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>