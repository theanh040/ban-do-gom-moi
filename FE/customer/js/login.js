document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) {
        console.error("Form loginForm không tồn tại!");
        return;
    }

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        console.log("Sự kiện submit đã được kích hoạt với phương thức POST.");

        let username = document.getElementById("username").value.trim();
        let password = document.getElementById("password").value.trim();

        document.getElementById("usernameError").innerText = "";
        document.getElementById("passwordError").innerText = "";

        if (username === '' || password === '') {
            if (username === '') {
                document.getElementById("usernameError").innerText = "Vui lòng nhập tên đăng nhập hoặc email.";
            }
            if (password === '') {
                document.getElementById("passwordError").innerText = "Vui lòng nhập mật khẩu.";
            }
            return;
        }

        let formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        console.log("Dữ liệu gửi đi:", { username, password });

        try {
            let response = await fetch("/BE/api/login.php", {
                method: "POST",
                body: formData,
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            if (!response.ok) {
                throw new Error("Lỗi kết nối server: " + response.status);
            }

            let result = await response.json();
            console.log("Server response (JSON):", result);
            if (result.success) {
                localStorage.setItem("loggedInUser", result.username || username);
                alert("Đăng nhập thành công! Chuyển hướng đến trang chủ.");
                window.location.href = "/FE/index.html";
            } else if (username === 'admin' && password === 'admin') {
                localStorage.setItem("loggedInUser", "admin");
                alert("Đăng nhập thành công với tài khoản admin!");
                window.location.href = "/FE/customer/views/admin.html";
            } else {
                if (result.error_field) {
                    document.getElementById(result.error_field).innerText = result.message;
                } else {
                    alert(result.message);
                }
            }
        } catch (error) {
            console.error("Lỗi:", error);
            if (error.message.includes("SyntaxError")) {
                alert("Lỗi server: Phản hồi không phải JSON. Vui lòng kiểm tra log server.");
            } else {
                alert("Đã xảy ra lỗi, vui lòng thử lại sau: " + error.message);
            }
        }
    });
});