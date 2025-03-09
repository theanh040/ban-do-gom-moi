<?php
// Bật CORS (loại bỏ header Authorization vì không cần kiểm tra quyền)
header("Access-Control-Allow-Origin: http://localhost:3000"); // Cho phép origin của frontend
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

    // Nhận product_id từ URL
$product_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : 0;

if ($product_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Product ID không hợp lệ."]);
    exit;
}

try {
    // Kiểm tra dữ liệu từ request
    $data = json_decode(file_get_contents("php://input"), true);
    error_log("Dữ liệu JSON từ request: " . print_r($data, true)); // Debug dữ liệu JSON

    if (!$data && $_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Nếu không có JSON, kiểm tra FormData (hình ảnh)
        if (empty($_FILES['image'])) {
            $data = [
                'product_name' => $_POST['product_name'] ?? null,
                'price' => $_POST['price'] ?? null,
                'description' => $_POST['description'] ?? null,
                'category_id' => $_POST['category_id'] ?? null
            ];
        }
        error_log("Dữ liệu POST từ FormData: " . print_r($data, true)); // Debug dữ liệu POST
    }

    // Kiểm tra dữ liệu, cho phép giá trị rỗng nhưng báo lỗi nếu không có trường nào
    if (!$data) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dữ liệu không được gửi."]);
        exit;
    }

    // Kiểm tra từng trường, chỉ báo lỗi nếu thiếu hoàn toàn
    $requiredFields = ['product_name', 'price', 'description', 'category_id'];
    $missingFields = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || $data[$field] === null) { // Chỉ kiểm tra null
            $missingFields[] = $field;
        }
    }

    if (!empty($missingFields)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dữ liệu không đầy đủ. Các trường thiếu: " . implode(", ", $missingFields) . ". Dữ liệu nhận được: " . print_r($data, true)]);
        exit;
    }

    // Cập nhật sản phẩm (không có hình ảnh mới)
    $sql = "UPDATE products SET product_name = ?, price = ?, description = ?, category_id = ? WHERE product_id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn SQL: " . $conn->error);
    }

    $stmt->bind_param("sdssi", $data['product_name'], $data['price'], $data['description'], $data['category_id'], $product_id);
    $stmt->execute();

    // Kiểm tra nếu có file hình ảnh mới
    if (!empty($_FILES['image']['name'])) {
        $uploadDir = '../uploads/';
        $fileName = basename($_FILES['image']['name']);
        $filePath = $uploadDir . $fileName;

        // Xóa hình ảnh cũ (nếu có)
        $oldProduct = $conn->query("SELECT image FROM products WHERE product_id = $product_id")->fetch_assoc();
        if ($oldProduct && $oldProduct['image'] && file_exists($uploadDir . basename($oldProduct['image']))) {
            unlink($uploadDir . basename($oldProduct['image']));
        }

        // Upload hình ảnh mới
        if (move_uploaded_file($_FILES['image']['tmp_name'], $filePath)) {
            $updateImageSql = "UPDATE products SET image = ? WHERE product_id = ?";
            $stmtImage = $conn->prepare($updateImageSql);
            $stmtImage->bind_param("si", $fileName, $product_id);
            $stmtImage->execute();
            $stmtImage->close();
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Lỗi tải lên hình ảnh."]);
            exit;
        }
    }

    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Cập nhật sản phẩm thành công!"]);
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