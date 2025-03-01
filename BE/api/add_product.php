<?php
// Kết nối đến cơ sở dữ liệu
include("../config/db.php");

// Kiểm tra nếu phương thức request là POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Lấy dữ liệu từ form gửi lên
    $productName = $_POST['productName'];
    $productPrice = $_POST['productPrice'];
    $productDescription = $_POST['productDescription'];
    $category_id = $_POST['category_id'];

    // Thiết lập thư mục lưu ảnh
    $targetDir = "../uploads/";

    // Lấy tên file ảnh từ dữ liệu tải lên
    $imageName = basename($_FILES["productImage"]["name"]);

    // Tạo đường dẫn đầy đủ để lưu file trên server
    $targetFilePath = $targetDir . $imageName;

    // Đường dẫn ảnh sẽ lưu vào database (chỉ lấy "uploads/filename.jpg")
    $imagePathDB = "uploads/" . $imageName;

    // Di chuyển file ảnh từ thư mục tạm vào thư mục đích
    if (move_uploaded_file($_FILES["productImage"]["tmp_name"], $targetFilePath)) {
        // Câu lệnh SQL để thêm sản phẩm vào cơ sở dữ liệu
        $sql = "INSERT INTO products (product_name, price, description, image, category_id) 
                VALUES ('$productName', '$productPrice', '$productDescription', '$imagePathDB', '$category_id')";
        
        // Thực thi truy vấn SQL
        if (mysqli_query($conn, $sql)) {
            // Nếu thành công, trả về phản hồi JSON
            echo json_encode(["success" => true, "message" => "Sản phẩm đã thêm!"]);
        } else {
            // Nếu có lỗi SQL, trả về lỗi chi tiết
            echo json_encode(["success" => false, "message" => "Lỗi SQL: " . mysqli_error($conn)]);
        }
    } else {
        // Nếu lỗi khi tải ảnh lên, trả về lỗi JSON
        echo json_encode(["success" => false, "message" => "Lỗi khi tải ảnh lên."]);
    }
}
?>
