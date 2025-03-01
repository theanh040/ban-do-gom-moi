<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:\xampp\php\logs\php_error.log');

require_once "../config/db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Accept");

$method = $_SERVER["REQUEST_METHOD"];
$input = file_get_contents("php://input");
$data = json_decode($input, true) ?? [];

if ($method === "GET") {
    $user_id = $_GET["user_id"] ?? null;
    if (!$user_id || !is_numeric($user_id)) {
        echo json_encode(["success" => false, "message" => "User ID không hợp lệ."]);
        exit;
    }

    $user_id = (int)$user_id;
    try {
        $stmt = $conn->prepare("SELECT o.order_id, oi.order_item_id, p.product_id, p.product_name, p.price, p.image, oi.quantity 
                               FROM orders o 
                               JOIN order_items oi ON o.order_id = oi.order_id 
                               JOIN products p ON oi.product_id = p.product_id 
                               WHERE o.user_id = ? AND o.order_status = 'pending'");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $cart = ["order_items" => []];
        while ($row = $result->fetch_assoc()) {
            $cart["order_items"][] = $row;
        }
        echo json_encode(["success" => true, "order_items" => $cart["order_items"]]);
    } catch (Exception $e) {
        error_log("Lỗi: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Lỗi tải giỏ hàng."]);
    }
} elseif ($method === "PUT") {
    if (empty($data["user_id"]) || empty($data["product_id"]) || empty($data["quantity"])) {
        echo json_encode(["success" => false, "message" => "Dữ liệu không đầy đủ."]);
        exit;
    }

    $user_id = (int)$data["user_id"];
    $product_id = (int)$data["product_id"];
    $quantity = (int)$data["quantity"];

    if ($user_id <= 0 || $product_id <= 0 || $quantity <= 0) {
        echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ."]);
        exit;
    }

    try {
        // Kiểm tra user và product
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            echo json_encode(["success" => false, "message" => "Người dùng không tồn tại."]);
            exit;
        }

        $stmt = $conn->prepare("SELECT product_id, price FROM products WHERE product_id = ?");
        $stmt->bind_param("i", $product_id);
        $stmt->execute();
        $product_result = $stmt->get_result();
        if ($product_result->num_rows === 0) {
            echo json_encode(["success" => false, "message" => "Sản phẩm không tồn tại."]);
            exit;
        }
        $product = $product_result->fetch_assoc();
        $price = $product["price"];

        // Tìm hoặc tạo đơn hàng pending
        $stmt = $conn->prepare("SELECT order_id FROM orders WHERE user_id = ? AND order_status = 'pending'");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt = $conn->prepare("INSERT INTO orders (user_id, total_price, order_status) VALUES (?, 0, 'pending')");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $order_id = $conn->insert_id;
        } else {
            $order = $result->fetch_assoc();
            $order_id = $order["order_id"];
        }

        // Thêm hoặc cập nhật sản phẩm trong giỏ
        $stmt = $conn->prepare("SELECT order_item_id FROM order_items WHERE order_id = ? AND product_id = ?");
        $stmt->bind_param("ii", $order_id, $product_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $stmt = $conn->prepare("UPDATE order_items SET quantity = ? WHERE order_id = ? AND product_id = ?");
            $stmt->bind_param("iii", $quantity, $order_id, $product_id);
        } else {
            $stmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iiid", $order_id, $product_id, $quantity, $price);
        }
        $stmt->execute();

        // Cập nhật tổng giá
        $stmt = $conn->prepare("UPDATE orders SET total_price = (
            SELECT SUM(oi.quantity * p.price) 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.product_id 
            WHERE oi.order_id = ?
        ) WHERE order_id = ?");
        $stmt->bind_param("ii", $order_id, $order_id);
        $stmt->execute();

        echo json_encode(["success" => true, "message" => "Thêm vào giỏ thành công!"]);
    } catch (Exception $e) {
        error_log("Lỗi: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Lỗi thêm vào giỏ hàng."]);
    }
} elseif ($method === "DELETE") {
    if (empty($data["user_id"]) || empty($data["product_id"])) {
        echo json_encode(["success" => false, "message" => "Dữ liệu không đầy đủ."]);
        exit;
    }

    $user_id = (int)$data["user_id"];
    $product_id = (int)$data["product_id"];

    try {
        $stmt = $conn->prepare("SELECT order_id FROM orders WHERE user_id = ? AND order_status = 'pending'");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["success" => false, "message" => "Không tìm thấy giỏ hàng."]);
            exit;
        }

        $order_id = $result->fetch_assoc()["order_id"];
        $stmt = $conn->prepare("DELETE FROM order_items WHERE order_id = ? AND product_id = ?");
        $stmt->bind_param("ii", $order_id, $product_id);
        $stmt->execute();

        $stmt = $conn->prepare("UPDATE orders SET total_price = (
            SELECT SUM(oi.quantity * p.price) 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.product_id 
            WHERE oi.order_id = ?
        ) WHERE order_id = ?");
        $stmt->bind_param("ii", $order_id, $order_id);
        $stmt->execute();

        echo json_encode(["success" => true, "message" => "Xóa sản phẩm thành công!"]);
    } catch (Exception $e) {
        error_log("Lỗi: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Lỗi xóa sản phẩm."]);
    }
}

if (isset($stmt)) $stmt->close();
if (isset($conn)) $conn->close();
?>