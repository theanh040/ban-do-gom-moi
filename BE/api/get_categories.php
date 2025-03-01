<?php
// Kết nối đến cơ sở dữ liệu
include '../config/db.php';

// Truy vấn lấy danh sách danh mục
$sql = "SELECT category_id, category_name FROM categories";
$result = $conn->query($sql);

// Mảng để lưu trữ danh mục
$categories = [];

// Lặp qua kết quả truy vấn và lưu vào mảng
while ($row = $result->fetch_assoc()) {
    $categories[] = $row;
}

// Kiểm tra nếu không có danh mục nào
if (empty($categories)) {
    echo json_encode(["success" => false, "message" => "Không có danh mục nào"]);
} else {
    // Trả về danh sách danh mục dưới dạng JSON
    echo json_encode($categories);
}

// Đóng kết nối CSDL
$conn->close();
?>
