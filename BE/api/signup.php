<?php
// Kết nối database
require_once "../config/db.php";

header("Content-Type: application/json");

// Xử lý yêu cầu POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST["username"] ?? '');
    $email = trim($_POST["email"] ?? '');
    $password = trim($_POST["password"] ?? '');

    // Kiểm tra dữ liệu không rỗng
    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Vui lòng điền đầy đủ thông tin."]);
        exit;
    }

    // Kiểm tra định dạng dữ liệu
    if (strlen($username) < 4) {
        echo json_encode(["success" => false, "error_field" => "userError", "message" => "Tên đăng nhập phải có ít nhất 4 ký tự."]);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "error_field" => "emailError", "message" => "Email không hợp lệ."]);
        exit;
    }
    if (strlen($password) < 6) {
        echo json_encode(["success" => false, "error_field" => "passwordError", "message" => "Mật khẩu phải có ít nhất 6 ký tự."]);
        exit;
    }

    // Hash mật khẩu
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Kiểm tra username hoặc email đã tồn tại
    $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $stmt->bind_result($count);
    $stmt->fetch();
    $stmt->close();

    if ($count > 0) {
        echo json_encode(["success" => false, "message" => "Tên đăng nhập hoặc email đã tồn tại."]);
        exit;
    }

    // Thêm tài khoản mới
    $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $email, $hashed_password);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Đăng ký thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Lỗi hệ thống, vui lòng thử lại sau: " . $conn->error]);
    }

    $stmt->close();
    $conn->close();
}
?>