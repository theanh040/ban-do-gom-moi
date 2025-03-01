<?php
// Bật CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Accept");


include("../config/db.php");

// Nhận `product_id` hoặc `category_id` từ URL
$product_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;

// Kiểm tra tham số và lấy dữ liệu tương ứng
if ($product_id > 0) {
    // Lấy chi tiết một sản phẩm
    $sql = "SELECT * FROM products WHERE product_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $product_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Sản phẩm không tồn tại."]);
        exit;
    }

    $product = $result->fetch_assoc();
    // Xử lý đường dẫn ảnh để khớp với cấu trúc server
    $product['image'] = 'http://localhost/gomseller/BE/uploads/' . basename($product['image']);
    $product['description'] = $product['description'] ?? "Không có mô tả."; // Đảm bảo có mô tả
    echo json_encode(["success" => true, "product" => $product]);
} elseif ($category_id > 0) {
    // Lấy danh sách sản phẩm theo danh mục (giữ nguyên chức năng cũ)
    $sql = "SELECT * FROM products WHERE category_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $category_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $products = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Xử lý đường dẫn ảnh để khớp với cấu trúc server
        $row['image'] = "/BE/" . $row['image']; // Gắn đúng đường dẫn ảnh
        $products[] = $row;
    }
    echo json_encode($products);
} else {
    // Lấy tất cả sản phẩm (giữ nguyên chức năng cũ)
    $sql = "SELECT * FROM products";
    $result = mysqli_query($conn, $sql);

    $products = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Xử lý đường dẫn ảnh để khớp với cấu trúc server
        $row['image'] = "/BE/" . $row['image']; // Gắn đúng đường dẫn ảnh
        $products[] = $row;
    }
    echo json_encode($products);
}

// Đóng kết nối
$conn->close();
?>