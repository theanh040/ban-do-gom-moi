document.addEventListener("DOMContentLoaded", async () => {
    console.log("Admin-orders.js đã được tải và chạy!");

    // Tải danh sách đơn hàng khi trang tải
    await loadOrders();

    // Gắn sự kiện cho thanh tìm kiếm
    document.getElementById("orderSearch").addEventListener("input", debounce(loadOrders, 300));
    document.getElementById("orderStatusFilter").addEventListener("change", loadOrders);
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Tải danh sách đơn hàng từ API
async function loadOrders() {
    try {
        const search = document.getElementById("orderSearch").value;
        const status = document.getElementById("orderStatusFilter").value;
        const query = new URLSearchParams({
            search: search || "",
            status: status || ""
        }).toString();

        const response = await fetch(`/BE/api/orders.php?${query}`, {
            method: 'GET',
            mode: 'cors',
        });

        if (!response.ok) {
            let errorText = await response.text();
            console.error("Lỗi từ server (text):", errorText);

            // Thử parse errorText thành JSON nếu có
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                console.error("Không thể parse phản hồi thành JSON:", parseError);
                throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi - " + errorText.substring(0, 100) + "...");
            }

            throw new Error(`Lỗi server: ${response.status} - ${errorData.message || errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi.");
        }

        const orders = await response.json();
        console.log("Dữ liệu đơn hàng từ API:", orders);

        const tbody = document.getElementById("ordersBody");
        tbody.innerHTML = ''; // Xóa nội dung cũ

        if (Array.isArray(orders)) {
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="ID Đơn Hàng">${order.order_id}</td>
                    <td data-label="Người Dùng">${order.user_id || 'Không rõ'}</td>
                    <td data-label="Tổng Giá">${formatCurrency(order.total_price)} VND</td>
                    <td data-label="Trạng Thái">${order.order_status}</td>
                    <td data-label="Ngày Đặt">${order.order_date}</td>
                    <td data-label="Hành Động">
                        <button class="action-btn view-btn" data-order-id="${order.order_id}" onclick="viewOrderDetails(${order.order_id})">Xem</button>
                        <button class="action-btn update-btn" data-order-id="${order.order_id}" onclick="updateOrderStatus(${order.order_id})">Cập nhật</button>
                        <button class="action-btn delete-btn" data-order-id="${order.order_id}" onclick="deleteOrder(${order.order_id})">Xóa</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            throw new Error("Dữ liệu đơn hàng không hợp lệ.");
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
        alert("Không thể tải danh sách đơn hàng. Vui lòng thử lại: " + error.message);
    }
}

// Hàm định dạng tiền tệ
function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Hàm xem chi tiết đơn hàng
async function viewOrderDetails(orderId) {
    try {
        // Sửa đường dẫn API để trỏ đến backend trên XAMPP (localhost:80)
        const response = await fetch(`http://localhost/gomseller/BE/api/order_details.php?id=${orderId}`, {
            method: 'GET',
            mode: 'cors',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Lỗi server: ${response.status} - ${errorData.message || await response.text()}`);
        }

        const orderDetails = await response.json();
        console.log("Chi tiết đơn hàng:", orderDetails);

        // Hiển thị modal
        const modal = document.getElementById("orderDetailsModal");
        const modalContent = document.getElementById("orderDetailsContent");

        // Điền thông tin cơ bản của đơn hàng
        document.getElementById("detailOrderId").textContent = orderDetails.order_id || "N/A";
        document.getElementById("detailUser").textContent = orderDetails.username || orderDetails.user_id || "Không rõ";
        document.getElementById("detailTotalPrice").textContent = formatCurrency(orderDetails.total_price) + " VND";
        document.getElementById("detailStatus").textContent = orderDetails.order_status || "N/A";
        document.getElementById("detailOrderDate").textContent = orderDetails.order_date || "N/A";

        // Điền chi tiết sản phẩm
        const itemsBody = document.getElementById("orderItemsBody");
        itemsBody.innerHTML = ""; // Xóa nội dung cũ

        if (Array.isArray(orderDetails.items) && orderDetails.items.length > 0) {
            orderDetails.items.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.product_name || "N/A"}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${formatCurrency(item.price) || "0"} VND</td>
                    <td>${formatCurrency(item.price * item.quantity) || "0"} VND</td>
                `;
                itemsBody.appendChild(row);
            });
        } else {
            itemsBody.innerHTML = "<tr><td colspan='4'>Không có sản phẩm nào trong đơn hàng này.</td></tr>";
        }

        // Hiển thị modal
        modal.style.display = "flex";

        // Đóng modal khi nhấn nút "x"
        const closeBtn = modal.querySelector(".close");
        closeBtn.onclick = () => {
            modal.style.display = "none";
        };

        // Đóng modal khi nhấn ra ngoài
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };

    } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        alert(`Không thể tải chi tiết đơn hàng. Lỗi: ${error.message}`);
    }
}

// Hàm định dạng tiền tệ
function formatCurrency(amount) {
    return Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function exportOrdersToCSV() {
    if (!window.currentOrders || window.currentOrders.length === 0) {
        alert("Không có dữ liệu đơn hàng để xuất!");
        return;
    }

    // Định nghĩa tiêu đề cột
    const headers = ["ID Đơn Hàng", "Người Dùng", "Tổng Giá (VND)", "Trạng Thái", "Ngày Đặt"];
    const rows = window.currentOrders.map(order => [
        order.order_id,
        order.user_id,
        formatCurrency(order.total_price),
        order.order_status,
        order.order_date
    ]);

    // Tạo nội dung CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    // Tạo link tải xuống
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// Hàm cập nhật trạng thái đơn hàng
async function updateOrderStatus(orderId) {
    const newStatus = prompt("Nhập trạng thái mới (pending, processing, shipped, completed, cancelled):");
    if (!newStatus || !['pending', 'processing', 'shipped', 'completed', 'cancelled'].includes(newStatus)) {
        alert("Trạng thái không hợp lệ. Vui lòng chọn: pending, processing, shipped, completed, hoặc cancelled.");
        return;
    }

    try {
        const response = await fetch(`/BE/api/update_order.php?id=${orderId}`, {
            method: 'PUT',
            mode: 'cors',
            body: JSON.stringify({ order_status: newStatus }),
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${await response.text()}`);
        }

        const result = await response.json();
        if (result.success) {
            alert("Cập nhật trạng thái đơn hàng thành công!");
            loadOrders(); // Tải lại danh sách đơn hàng
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        alert("Không thể cập nhật trạng thái. Vui lòng thử lại: " + error.message);
    }
}

// Hàm xóa đơn hàng
async function deleteOrder(orderId) {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) return;

    try {
        const response = await fetch(`/BE/api/delete_order.php?id=${orderId}`, {
            method: 'DELETE',
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${await response.text()}`);
        }

        const result = await response.json();
        if (result.success) {
            alert("Xóa đơn hàng thành công!");
            loadOrders(); // Tải lại danh sách đơn hàng
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi khi xóa đơn hàng:", error);
        alert("Không thể xóa đơn hàng. Vui lòng thử lại: " + error.message);
    }
}