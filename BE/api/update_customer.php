<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
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

// Nhận user_id từ URL
$user_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : 0;

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID không hợp lệ."]);
    exit;
}

try {
    // Lấy dữ liệu từ body
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['username']) || !isset($data['email']) || !isset($data['role'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dữ liệu không đầy đủ."]);
        exit;
    }

    $username = $data['username'];
    $email = $data['email'];
    $role = $data['role'];

    $valid_roles = ['admin', 'customer'];
    if (!in_array($role, $valid_roles)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Vai trò không hợp lệ. Vui lòng chọn: admin hoặc customer."]);
        exit;
    }

    // Kiểm tra username và email không trùng lặp (trừ bản thân khách hàng đang cập nhật)
    $checkSql = "SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("ssi", $username, $email, $user_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Tên đăng nhập hoặc email đã tồn tại."]);
        exit;
    }
    $checkStmt->close();

    // Cập nhật thông tin khách hàng
    $sql = "UPDATE users SET username = ?, email = ?, role = ? WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn SQL: " . $conn->error);
    }

    $stmt->bind_param("sssi", $username, $email, $role, $user_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Cập nhật thông tin khách hàng thành công!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Không có thay đổi nào được thực hiện."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}