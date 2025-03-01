<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once "../config/db.php";

$query = $_GET['q'] ?? '';
try {
    $stmt = $conn->prepare("
        SELECT product_id, product_name, price, image 
        FROM products 
        WHERE product_name LIKE ? 
        LIMIT 10
    ");
    $searchTerm = "%" . $conn->real_escape_string($query) . "%";
    $stmt->bind_param("s", $searchTerm);
    $stmt->execute();
    $result = $stmt->get_result();

    $products = [];
    while ($row = $result->fetch_assoc()) {
        // Đảm bảo đường dẫn hình ảnh là '/uploads/filename.jpg'
        $row['image'] = "/BE/" . $row['image']; // Gắn đúng đường dẫn ảnh
        $products[] = $row;
    }

    echo json_encode($products);
} catch (Exception $e) {
    error_log("Lỗi: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi khi tìm kiếm sản phẩm: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>