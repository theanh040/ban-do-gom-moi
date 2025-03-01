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
    // Lấy tham số tìm kiếm và lọc
    $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
    $role = isset($_GET['role']) ? $conn->real_escape_string($_GET['role']) : '';

    // Truy vấn để lấy danh sách khách hàng
    $sql = "SELECT user_id, username, email, role, created_at 
            FROM users 
            WHERE 1=1";
    
    if ($search) {
        $sql .= " AND (username LIKE '%$search%' OR email LIKE '%$search%')";
    }
    if ($role) {
        $sql .= " AND role = '$role'";
    }

    $sql .= " ORDER BY created_at DESC LIMIT 50"; // Giới hạn 50 khách hàng gần nhất

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Lỗi thực thi truy vấn SQL: " . $conn->error);
    }

    $customers = [];
    while ($row = $result->fetch_assoc()) {
        $customers[] = [
            "user_id" => (int)$row['user_id'],
            "username" => $row['username'],
            "email" => $row['email'],
            "role" => $row['role'],
            "created_at" => $row['created_at']
        ];
    }

    echo json_encode($customers);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}