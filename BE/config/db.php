<?php
$host = "localhost"; // Địa chỉ MySQL Server
$user = "root"; // Tên đăng nhập MySQL (mặc định là root)
$pass = ""; 
$dbname = "lac_hong_store"; 

// Kết nối MySQL
$conn = new mysqli($host, $user, $pass, $dbname);

// Kiểm tra kết nối
if ($conn->connect_error) {
    die("Kết nối thất bại: " . $conn->connect_error);
}


$conn->set_charset("utf8"); // Đảm bảo dữ liệu hiển thị tiếng Việt
?>
