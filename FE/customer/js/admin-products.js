document.addEventListener("DOMContentLoaded", async () => {
    console.log("Admin-products.js đã được tải và chạy!");

    // Vì đã đăng nhập vào admin dashboard, không cần kiểm tra quyền admin nữa
    await loadProductsForDelete(); // Tải sản phẩm cho phần Xóa
    await loadProductsForUpdate(); // Tải sản phẩm cho phần Cập nhật

    // Xử lý đăng xuất (sử dụng từ admin.js)
    document.querySelector('.log-out a').addEventListener('click', () => {
        localStorage.clear();
        console.log("Đã đăng xuất, xóa thông tin localStorage.");
        window.location.href = "/FE/index.html";
    });
});

// Hàm tải danh sách sản phẩm cho Xóa
async function loadProductsForDelete() {
    try {
        const response = await fetch(`http://localhost:3000/BE/api/get_products.php`, {
            mode: 'cors',
        });
        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi.");
        }

        const products = await response.json();

        const container = document.getElementById("productsGridDelete");
        container.innerHTML = ""; // Xóa nội dung cũ

        if (Array.isArray(products)) {
            products.forEach(product => {
                const productCard = document.createElement("div");
                productCard.className = "product-card";
                productCard.innerHTML = `
                    <img src="${product.image || '/FE/customer/img/default.jpg'}" alt="${product.product_name}" onerror="this.src='/FE/customer/img/default.jpg'">
                    <h3>${product.product_name || "Không có tên sản phẩm"}</h3>
                    <p>Giá: ${parseInt(product.price || 0).toLocaleString()} VNĐ</p>
                    <p>Mô tả: ${product.description || "Không có mô tả"}</p>
                    <div class="product-actions">
                        <button class="delete-btn" data-product-id="${product.product_id}">Xóa</button>
                    </div>
                `;
                container.appendChild(productCard);
            });

            // Gắn sự kiện cho nút xóa
            document.querySelectorAll(".delete-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const productId = e.target.getAttribute("data-product-id");
                    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                        await deleteProduct(productId);
                        await loadProductsForDelete(); // Tải lại danh sách sau khi xóa
                    }
                });
            });
        } else {
            throw new Error("Dữ liệu trả về không hợp lệ.");
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm để xóa:", error);
        alert("Không thể tải danh sách sản phẩm. Vui lòng thử lại: " + error.message);
    }
}

// Hàm tải danh sách sản phẩm cho Cập nhật
async function loadProductsForUpdate() {
    try {
        const response = await fetch(`http://localhost:3000/BE/api/get_products.php`, {
            mode: 'cors',
        });
        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi.");
        }

        const products = await response.json();

        const container = document.getElementById("productsGridUpdate");
        container.innerHTML = ""; // Xóa nội dung cũ

        if (Array.isArray(products)) {
            products.forEach(product => {
                const productCard = document.createElement("div");
                productCard.className = "product-card";
                productCard.innerHTML = `
                    <img src="${product.image || '/FE/customer/img/default.jpg'}" alt="${product.product_name}" onerror="this.src='/FE/customer/img/default.jpg'">
                    <h3>${product.product_name || "Không có tên sản phẩm"}</h3>
                    <p>Giá: ${parseInt(product.price || 0).toLocaleString()} VNĐ</p>
                    <p>Mô tả: ${product.description || "Không có mô tả"}</p>
                    <div class="product-actions">
                        <button class="edit-btn" data-product-id="${product.product_id}">Sửa</button>
                    </div>
                `;
                container.appendChild(productCard);
            });

            // Gắn sự kiện cho nút sửa
            document.querySelectorAll(".edit-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const productId = e.target.getAttribute("data-product-id");
                    window.location.href = `/FE/customer/views/edit-product.html?id=${productId}`;
                });
            });
        } else {
            throw new Error("Dữ liệu trả về không hợp lệ.");
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm để cập nhật:", error);
        alert("Không thể tải danh sách sản phẩm. Vui lòng thử lại: " + error.message);
    }
}

// Hàm xóa sản phẩm
async function deleteProduct(productId) {
    try {
        const response = await fetch(`http://localhost:3000/BE/api/delete_product.php?id=${productId}`, {
            method: "DELETE",
            mode: 'cors',
        });

        if (!response.ok) {
            let errorText = await response.text();
            console.error("Lỗi từ server:", errorText);
            throw new Error("Lỗi xóa sản phẩm: " + errorText);
        }

        const result = await response.json();
        if (result.success) {
            alert("Xóa sản phẩm thành công!");
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể xóa sản phẩm. Vui lòng thử lại: " + error.message);
    }
}