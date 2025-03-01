document.addEventListener("DOMContentLoaded", async () => {
    console.log("Product-detail.js đã được tải và chạy!");

    // Lấy product_id từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId || isNaN(productId)) {
        alert("Sản phẩm không hợp lệ. Vui lòng thử lại.");
        window.location.href = "/FE/index.html";
        return;
    }

    try {
        // Gọi API get_products.php với product_id
        const response = await fetch(`http://localhost:3000/BE/api/get_products.php?id=${productId}`, {
            mode: 'cors', // Đảm bảo sử dụng chế độ CORS
        });
        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi.");
        }

        const data = await response.json();

        // Kiểm tra dữ liệu trả về
        let product;
        if (data.success === false) {
            throw new Error(data.message || "Không tìm thấy sản phẩm.");
        } else if (Array.isArray(data)) {
            // Nếu API trả về danh sách, tìm sản phẩm có product_id khớp
            product = data.find(p => p.product_id === parseInt(productId));
            if (!product) {
                throw new Error("Không tìm thấy sản phẩm trong danh sách.");
            }
        } else if (data.product && typeof data.product === 'object') {
            // Nếu API trả về object duy nhất với wrapper "product"
            product = data.product;
        } else {
            throw new Error("Dữ liệu trả về không hợp lệ.");
        }

        console.log("Dữ liệu sản phẩm chi tiết nhận được:", product); // Debug

        // Kiểm tra và hiển thị thông tin sản phẩm với giá trị mặc định
        document.getElementById("productImage").src = product.image || "/FE/customer/img/default.jpg";
        document.getElementById("productName").textContent = product.product_name || "Không có tên sản phẩm";
        document.getElementById("productDescription").textContent = product.description || "Không có mô tả.";
        document.getElementById("productPrice").textContent = `${parseInt(product.price || 0).toLocaleString()} VNĐ`;

        // Gắn sự kiện cho nút điều khiển số lượng
        const decreaseBtn = document.getElementById("decreaseQty");
        const increaseBtn = document.getElementById("increaseQty");
        const quantityInput = document.getElementById("quantity");
        let quantity = parseInt(quantityInput.value) || 1; // Đảm bảo quantity không rỗng

        decreaseBtn.addEventListener("click", () => {
            if (quantity > 1) {
                quantity--;
                quantityInput.value = quantity;
            }
        });

        increaseBtn.addEventListener("click", () => {
            quantity++;
            quantityInput.value = quantity;
        });

        // Gắn sự kiện cho nút "Thêm vào giỏ"
        const addToCartBtn = document.getElementById("addToCartBtn");
        addToCartBtn.addEventListener("click", () => addToCart(productId, quantity));
    } catch (error) {
        console.error("Lỗi khi tải thông tin sản phẩm:", error);
        alert("Không thể tải thông tin sản phẩm. Vui lòng thử lại: " + error.message);
        // Chuyển hướng về trang chủ nếu lỗi nghiêm trọng
        window.location.href = "/FE/index.html";
    }
});

// Hàm thêm sản phẩm vào giỏ hàng
async function addToCart(productId, quantity) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
        window.location.href = "/FE/customer/views/login.html";
        return;
    }

    let userId = localStorage.getItem("loggedInUserId");
    if (!userId) {
        userId = await window.getUserId(loggedInUser);
        if (!userId) {
            alert("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
        }
        localStorage.setItem("loggedInUserId", userId);
    }

    if (!productId || isNaN(productId) || productId <= 0) {
        alert("Sản phẩm không hợp lệ. Vui lòng thử lại.");
        console.error("Product ID không hợp lệ:", productId);
        return;
    }

    try {
        let response = await fetch(`http://localhost:3000/BE/api/cart.php`, {
            method: "PUT",
            body: JSON.stringify({ user_id: userId, product_id: productId, quantity: quantity || 1 }),
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            let errorText = await response.text();
            console.error("Lỗi từ server:", errorText);
            throw new Error("Lỗi thêm sản phẩm vào giỏ: " + errorText);
        }

        let result = await response.json();
        if (result.success) {
            alert("Thêm vào giỏ thành công!");
            // Tùy chọn: Chuyển hướng về giỏ hàng
            // window.location.href = "/FE/customer/views/cart.html";
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể thêm sản phẩm vào giỏ. Vui lòng thử lại: " + error.message);
    }
}

// Định nghĩa window.getUserId (giả sử từ cart.js hoặc thêm vào đây)
window.getUserId = async (username) => {
    try {
        let response = await fetch(`http://localhost:3000/BE/api/user.php?username=${username}`, {
            method: "GET",
        });
        let result = await response.json();
        if (result.success) return result.user_id;
        return null;
    } catch (error) {
        console.error("Lỗi getUserId:", error);
        return null;
    }
};