// index.js
let slider = document.querySelector('.slider .list');
let items = document.querySelectorAll('.slider .list .item');
let next = document.getElementById('next');
let prev = document.getElementById('prev');
let dots = document.querySelectorAll('.slider .dots li');

let lengthItems = items.length - 1;
let active = 0;

next.onclick = function() {
    active = active + 1 <= lengthItems ? active + 1 : 0;
    reloadSlider();
}

prev.onclick = function() {
    active = active - 1 >= 0 ? active - 1 : lengthItems;
    reloadSlider();
}

let refreshInterval = setInterval(() => { next.click() }, 4500);

function reloadSlider() {
    slider.style.left = -items[active].offsetLeft + 'px';
    
    let last_active_dot = document.querySelector('.slider .dots li.active');
    last_active_dot.classList.remove('active');
    dots[active].classList.add('active');

    clearInterval(refreshInterval);
    refreshInterval = setInterval(() => { next.click() }, 3000);
}

dots.forEach((li, key) => {
    li.addEventListener('click', () => {
        active = key;
        reloadSlider();
    });
});

window.onresize = function(event) {
    reloadSlider();
};

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("http://localhost/gomseller/BE/api/get_low_price_products.php");
        const products = await response.json();

        // Kiểm tra API trả về đúng dữ liệu
        if (!products.sale || !products.best_sellers) {
            console.error("Lỗi: API không trả về dữ liệu đúng");
            return;
        }

        // Hiển thị sản phẩm vào hai section
        renderProducts(products.sale, "productGrid", true);
        renderProducts(products.best_sellers, "productGrids", false);
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu sản phẩm:", error);
    }

    // Không gọi loadCart trên index.html, chỉ xử lý addToCart
});

// Hàm hiển thị sản phẩm
function renderProducts(products, containerId, isSale) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Xóa nội dung cũ

    products.forEach((product) => {
        console.log("Đường dẫn ảnh:", product.image); // Kiểm tra URL ảnh

        const productHTML = `
            <div class="product-item" data-product-id="${product.product_id}" > 
                <img src="${product.image}" alt="${product.product_name}" class="product-image" 
                     onerror="this.onerror=null;this.src='http://localhost/gomseller/BE/uploads/default.jpg';" onclick="window.location.href='/FE/customer/views/product-detail.html?id=${product.product_id}'">
                <h3 class="product-name">${product.product_name}</h3>
                <p class="product-price">${parseInt(product.price).toLocaleString()} VND</p>
                <button class="buy-btn" data-product-id="${product.product_id}">Thêm vào giỏ</button>
            </div>
        `;
        container.innerHTML += productHTML;
    });

    // Gắn sự kiện onclick sau khi DOM được tạo
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = function() {
            addToCart(parseInt(this.getAttribute('data-product-id')));
        };
    });
}
// Hàm thêm sản phẩm vào giỏ hàng
// index.js
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
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể thêm sản phẩm vào giỏ. Vui lòng thử lại: " + error.message);
    }
}