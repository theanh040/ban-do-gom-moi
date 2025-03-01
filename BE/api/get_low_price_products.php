<?php
// Cho phép tất cả các domain truy cập API này
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Nếu request là OPTIONS, phản hồi 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include("../config/db.php");

// Lấy 6 sản phẩm có giá thấp nhất (SALE)
$sqlSale = "SELECT * FROM products ORDER BY price ASC LIMIT 10";
$resultSale = mysqli_query($conn, $sqlSale);
$saleProducts = mysqli_fetch_all($resultSale, MYSQLI_ASSOC);

// Lấy 10 sản phẩm tiếp theo (BÁN CHẠY)
$sqlBestSellers = "SELECT * FROM products ORDER BY price ASC LIMIT 8 OFFSET 6";
$resultBestSellers = mysqli_query($conn, $sqlBestSellers);
$bestSellers = mysqli_fetch_all($resultBestSellers, MYSQLI_ASSOC);

// ** Hàm xử lý đường dẫn ảnh đúng chuẩn **
function fixImagePath($imagePath) {
    // Nếu ảnh trống hoặc đường dẫn lỗi, dùng ảnh mặc định
    if (empty($imagePath) || !file_exists("../uploads/" . basename($imagePath))) {
        return "http://localhost/gomseller/BE/uploads/default.jpg";
    }

    // Đảm bảo đường dẫn chuẩn trên máy chủ
    $imagePath = basename($imagePath); // Chỉ lấy tên file
    return "http://localhost/gomseller/BE/uploads/" . $imagePath;
}


// ** Cập nhật đường dẫn ảnh cho tất cả sản phẩm **
foreach ($saleProducts as &$product) {
    $product['image'] = fixImagePath($product['image']);
}
foreach ($bestSellers as &$product) {
    $product['image'] = fixImagePath($product['image']);
}

// Trả về JSON
echo json_encode(["sale" => $saleProducts, "best_sellers" => $bestSellers], JSON_UNESCAPED_UNICODE);

$conn->close();
?>
