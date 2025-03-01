<?php
// Bật CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
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

// Nhận product_id từ URL
$product_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : 0;

if ($product_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Product ID không hợp lệ."]);
    exit;
}

try {
    // Xóa sản phẩm
    $sql = "DELETE FROM products WHERE product_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn SQL: " . $conn->error);
    }
    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Sản phẩm không tồn tại hoặc không thể xóa."]);
        exit;
    }

    // Xóa hình ảnh liên quan (nếu có)
    $oldProduct = $conn->query("SELECT image FROM products WHERE product_id = $product_id")->fetch_assoc();
    if ($oldProduct && $oldProduct['image'] && file_exists('../uploads/' . basename($oldProduct['image']))) {
        unlink('../uploads/' . basename($oldProduct['image']));
    }

    echo json_encode(["success" => true, "message" => "Xóa sản phẩm thành công!"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Lỗi hệ thống: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}