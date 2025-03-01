document.addEventListener("DOMContentLoaded", async () => {
    const categoryId = 1; // Chỉ lấy sản phẩm có category_id = 1 (Bình gốm)

    try {
        console.log(`Gọi API lấy sản phẩm của category_id = ${categoryId}`);

        const response = await fetch(`http://localhost/gomseller/BE/api/get_products.php?category_id=${categoryId}`);
        const products = await response.json();

        console.log("Dữ liệu sản phẩm nhận được:", products); // Debug

        if (!products || products.length === 0) {
            document.getElementById("productsGrid").innerHTML = "<p>Không có sản phẩm nào.</p>";
            return;
        }

        renderProducts(products);
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu sản phẩm:", error);
    }
});

// Hàm hiển thị sản phẩm
function renderProducts(products) {
    const container = document.getElementById("productsGrid");
    if (!container) {
        console.error("Không tìm thấy phần tử productsGrid");
        return;
    }

    container.innerHTML = ""; // Xóa nội dung cũ

    products.forEach((product) => {
        const productHTML = `
            <div class="product-card" onclick="window.location.href='/FE/customer/views/product-detail.html?id=${product.product_id}'">
                <img src="${product.image}" alt="${product.product_name}">
                <h3>${product.product_name}</h3>
                
                <p>Giá: ${parseInt(product.price).toLocaleString()} VNĐ</p>
                <button class="buy-btn" data-product-id="${product.product_id}">Thêm vào giỏ</button>
            </div>
        `;
        container.innerHTML += productHTML;
    });

    // Gắn sự kiện onclick sau khi render
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.getAttribute('data-product-id'));
            addToCart(productId);
        });
    });
}

// Hàm thêm sản phẩm vào giỏ hàng
async function addToCart(productId) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
        window.location.href = "/FE/customer/views/login.html";
        return;
    }

    let userId = localStorage.getItem("loggedInUserId"); // Lấy từ localStorage trước
    if (!userId) {
        // Nếu chưa có userId, lấy từ API
        userId = await window.getUserId(loggedInUser);
        if (!userId) {
            alert("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
        }
        localStorage.setItem("loggedInUserId", userId); // Lưu lại để dùng sau
    }

    if (!productId || isNaN(productId) || productId <= 0) {
        alert("Sản phẩm không hợp lệ. Vui lòng thử lại.");
        console.error("Product ID không hợp lệ:", productId);
        return;
    }

    try {
        let response = await fetch(`http://localhost:3000/BE/api/cart.php`, {
            method: "PUT",
            body: JSON.stringify({ user_id: userId, product_id: productId, quantity: 1 }),
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
