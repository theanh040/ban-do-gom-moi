<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // Tắt hiển thị lỗi trực tiếp trên trình duyệt
ini_set('log_errors', 1);
ini_set('error_log', 'C:\xampp\php\logs\php_error.log');

require_once "../config/db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

error_log("Phương thức yêu cầu: " . $_SERVER["REQUEST_METHOD"]);
error_log("Remote address: " . $_SERVER["REMOTE_ADDR"]);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username_or_email = trim($_POST["username"] ?? '');
    $password = trim($_POST["password"] ?? '');

    error_log("Username/email: " . $username_or_email);
    error_log("Password: " . $password);

    if (empty($username_or_email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Vui lòng điền đầy đủ thông tin."]);
        exit;
    }

    try {
        $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        if (!$stmt) {
            error_log("Lỗi prepare: " . $conn->error);
            echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $conn->error]);
            exit;
        }

        $stmt->bind_param("ss", $username_or_email, $username_or_email);
        $stmt->execute();
        $result = $stmt->get_result();

        error_log("Số dòng kết quả: " . $result->num_rows);

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user["password"])) {
                session_start();
                $_SESSION["user_id"] = $user["id"];
                $_SESSION["username"] = $user["username"];
                echo json_encode(["success" => true, "message" => "Đăng nhập thành công!", "username" => $user["username"]]);
            } else {
                echo json_encode(["success" => false, "error_field" => "passwordError", "message" => "Mật khẩu không đúng."]);
            }
        } else {
            echo json_encode(["success" => false, "error_field" => "usernameError", "message" => "Tên đăng nhập hoặc email không tồn tại."]);
        }
    } catch (Exception $e) {
        error_log("Lỗi database: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Lỗi hệ thống, vui lòng thử lại sau: " . $e->getMessage()]);
    } finally {
        if (isset($stmt)) $stmt->close();
        if (isset($conn)) $conn->close();
    }
} else {
    echo json_encode(["success" => false, "message" => "Phương thức không hợp lệ. Phương thức hiện tại: " . $_SERVER["REQUEST_METHOD"]]);
}
?>