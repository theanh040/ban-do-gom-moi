<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:\xampp\php\logs\php_error.log');

require_once "../config/db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

$username = $_GET["username"] ?? '';

if (empty($username)) {
    echo json_encode(["success" => false, "message" => "Username không hợp lệ."]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE username = ?");
    if (!$stmt) {
        error_log("Lỗi prepare: " . $conn->error);
        echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $conn->error]);
        exit;
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        echo json_encode(["success" => true, "user_id" => $user["user_id"]]);
    } else {
        echo json_encode(["success" => false, "message" => "Người dùng không tồn tại."]);
    }
} catch (Exception $e) {
    error_log("Lỗi: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống, vui lòng thử lại: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>