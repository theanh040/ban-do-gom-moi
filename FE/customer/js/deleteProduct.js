document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`http://localhost/gomseller/BE/api/get_all_products.php`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });
        if (!response.ok) {
            throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        }
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
            <img src="${product.image}" alt="${product.product_name}" class="product-image" 
                     onerror="this.onerror=null;this.src='http://localhost/gomseller/uploads/default.jpg';">
                <h3 class="product-name">${product.product_name}</h3>
                <p class="product-price">${parseInt(product.price).toLocaleString()} VND</p>
                <button onclick="deleteProduct(${product.product_id})">Xóa</button>
            `;
        container.innerHTML += productHTML;
    });
}

async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        return;
    }

    try {
        const response = await fetch(`/BE/api/delete_product.php?product_id=${productId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Lỗi khi xóa sản phẩm');
        }

        const result = await response.json();
        alert(result.message || 'Xóa sản phẩm thành công!');
        // Xóa sản phẩm khỏi giao diện
        const productItem = document.querySelector(`.product-item[data-product-id="${productId}"]`);
        if (productItem) productItem.remove();
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Không thể xóa sản phẩm. Vui lòng thử lại: ' + error.message);
    }
}

// Gắn hàm deleteProduct vào window để sử dụng trong HTML
window.deleteProduct = deleteProduct;