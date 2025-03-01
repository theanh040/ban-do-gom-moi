<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once "../config/db.php";

try {
    $stmt = $conn->prepare("SELECT product_id, product_name, price, image FROM products");
    $stmt->execute();
    $result = $stmt->get_result();

    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }

    echo json_encode(["success" => true, "products" => $products]);
} catch (Exception $e) {
    error_log("Lỗi: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Lỗi khi lấy danh sách sản phẩm: " . $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>