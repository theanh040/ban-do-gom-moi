document.addEventListener("DOMContentLoaded", async () => {
    console.log("Edit-product.js đã được tải và chạy!");

    // Lấy product_id từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId || isNaN(productId)) {
        alert("Sản phẩm không hợp lệ. Vui lòng thử lại.");
        window.location.href = "/FE/customer/views/admin/admin-products.html";
        return;
    }

    await loadProductDetails(productId);
    setupFormEventListeners(); // Đảm bảo hàm này được định nghĩa
});

// Hàm tải chi tiết sản phẩm
async function loadProductDetails(productId) {
    try {
        const response = await fetch(`http://localhost:3000/BE/api/get_products.php?id=${productId}`, {
            mode: 'cors',
        });
        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi.");
        }

        const data = await response.json();

        let product;
        if (data.success === false) {
            throw new Error(data.message || "Không tìm thấy sản phẩm.");
        } else if (data.product && typeof data.product === 'object') {
            product = data.product;
        } else {
            throw new Error("Dữ liệu trả về không hợp lệ.");
        }

        // Điền thông tin sản phẩm vào form
        document.getElementById("productId").value = product.product_id;
        document.getElementById("productName").value = product.product_name || "";
        document.getElementById("price").value = parseFloat(product.price) || 0;
        document.getElementById("description").value = product.description || "";
        document.getElementById("categoryId").value = product.category_id || 1; // Giả sử danh mục mặc định là 1
        document.getElementById("productImagePreview").src = product.image || "/FE/customer/img/default.jpg";
        document.getElementById("productImagePreview").style.display = product.image ? "block" : "none";
    } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        alert("Không thể tải chi tiết sản phẩm. Vui lòng thử lại: " + error.message);
        window.location.href = "/FE/customer/views/admin/admin-products.html";
    }
}

// Hàm thiết lập sự kiện cho form
function setupFormEventListeners() {
    const form = document.getElementById("editProductForm"); // Khai báo form, kiểm tra tồn tại
    if (!form) {
        console.error("Không tìm thấy form với id 'editProductForm'.");
        return; // Thoát nếu không tìm thấy form
    }

    const imageInput = document.getElementById("image");
    const imagePreview = document.getElementById("productImagePreview");

    // Preview hình ảnh khi chọn file
    if (imageInput) {
        imageInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        });
    } else {
        console.error("Không tìm thấy input với id 'image'.");
    }

    // Xử lý submit form
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const productId = formData.get("product_id");
        const productName = formData.get("product_name") || ""; // Giá trị mặc định nếu rỗng
        const price = formData.get("price") || 0; // Giá trị mặc định nếu rỗng
        const description = formData.get("description") || ""; // Giá trị mặc định nếu rỗng
        const categoryId = formData.get("category_id") || 1; // Giá trị mặc định nếu rỗng
        const imageFile = formData.get("image");

        // Debug dữ liệu trước khi gửi
        console.log("Dữ liệu gửi đi:", {
            productId,
            productName,
            price,
            description,
            categoryId,
            imageFile: imageFile ? imageFile.name : "Không có file hình ảnh"
        });

        if (!productId) {
            alert("Product ID không hợp lệ. Vui lòng thử lại.");
            return;
        }

        try {
            let response;
            if (imageFile && imageFile.size > 0) {
                // Đảm bảo tất cả các trường được thêm vào FormData, ngay cả khi rỗng
                formData.set("product_name", productName);
                formData.set("price", price);
                formData.set("description", description);
                formData.set("category_id", categoryId);

                response = await fetch(`http://localhost:3000/BE/api/update_product.php?id=${productId}`, {
                    method: "PUT",
                    body: formData,
                });
            } else {
                response = await fetch(`http://localhost:3000/BE/api/update_product.php?id=${productId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        product_name: productName,
                        price: price,
                        description: description,
                        category_id: categoryId
                    }),
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (!response.ok) {
                let errorText = await response.text();
                console.error("Lỗi từ server (text):", errorText);

                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (parseError) {
                    console.error("Không thể parse phản hồi thành JSON:", parseError);
                    throw new Error("Lỗi server: Phản hồi không phải JSON - " + errorText.substring(0, 100) + "...");
                }

                throw new Error("Lỗi cập nhật sản phẩm: " + (errorData.message || errorText));
            }

            const result = await response.json();
            if (result.success) {
                alert("Cập nhật sản phẩm thành công!");
                window.location.href = "/FE/customer/views/admin-products.html";
            } else {
                alert("Lỗi: " + result.message);
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Không thể cập nhật sản phẩm. Vui lòng thử lại: " + error.message);
            if (error.message.includes("Phản hồi không phải JSON")) {
                console.error("Phản hồi HTML từ server:", error.message);
            }
        }
    });
}

// Hàm đăng xuất (giữ nguyên như trước)
function handleLogout() {
    localStorage.clear();
    console.log("Đã đăng xuất, xóa thông tin localStorage.");
    window.location.href = "/FE/index.html";
}