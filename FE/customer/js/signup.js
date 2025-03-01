document.getElementById("signup-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    let username = document.getElementById("user").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();
    
    // Reset error messages
    document.getElementById("userError").innerText = "";
    document.getElementById("emailError").innerText = "";
    document.getElementById("passwordError").innerText = "";

    // Validate input
    let errors = false;
    if (username.length < 4) {
        document.getElementById("userError").innerText = "Tên đăng nhập phải có ít nhất 4 ký tự.";
        errors = true;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        document.getElementById("emailError").innerText = "Email không hợp lệ.";
        errors = true;
    }
    if (password.length < 6) {
        document.getElementById("passwordError").innerText = "Mật khẩu phải có ít nhất 6 ký tự.";
        errors = true;
    }

    if (errors) return;

    // Gửi dữ liệu đến PHP bằng Fetch API
    let formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);

    try {
        let response = await fetch("/BE/api/signup.php", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Lỗi kết nối server: " + response.status);
        }

        let result = await response.json();
        if (result.success) {
            alert("Đăng ký thành công! Chuyển hướng đến trang đăng nhập.");
            window.location.href = "/FE/customer/views/login.html"; // Sử dụng đường dẫn tuyệt đối
        } else {
            if (result.error_field) {
                document.getElementById(result.error_field).innerText = result.message;
            } else {
                alert(result.message);
            }
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Đã xảy ra lỗi, vui lòng thử lại sau: " + error.message);
    }
});