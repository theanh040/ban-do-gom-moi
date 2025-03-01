document.addEventListener("DOMContentLoaded", async () => {
    console.log("Admin-customers.js đã được tải và chạy!");

    // Tải danh sách khách hàng khi trang tải
    await loadCustomers();

    // Gắn sự kiện cho thanh tìm kiếm
    document.getElementById("customerSearch").addEventListener("input", debounce(loadCustomers, 300));
    document.getElementById("customerRoleFilter").addEventListener("change", loadCustomers);
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

// Tải danh sách khách hàng từ API
async function loadCustomers() {
    try {
        const search = document.getElementById("customerSearch").value;
        const role = document.getElementById("customerRoleFilter").value;
        const query = new URLSearchParams({
            search: search || "",
            role: role || ""
        }).toString();

        const response = await fetch(`/BE/api/customers.php?${query}`, {
            method: 'GET',
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Phản hồi không phải JSON, có thể là HTML lỗi.");
        }

        const customers = await response.json();

        const tbody = document.getElementById("customersBody");
        tbody.innerHTML = ''; // Xóa nội dung cũ

        if (Array.isArray(customers)) {
            customers.forEach(customer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="ID Khách Hàng">${customer.user_id}</td>
                    <td data-label="Tên Đăng Nhập">${customer.username || 'Không rõ'}</td>
                    <td data-label="Email">${customer.email || 'Không rõ'}</td>
                    <td data-label="Vai Trò">${customer.role || 'Không rõ'}</td>
                    <td data-label="Ngày Đăng Ký">${customer.created_at}</td>
                    <td data-label="Hành Động">
                        <button class="action-btn view-btn" data-user-id="${customer.user_id}" onclick="viewCustomerDetails(${customer.user_id})">Xem</button>
                        <button class="action-btn update-btn" data-user-id="${customer.user_id}" onclick="updateCustomer(${customer.user_id})">Cập nhật</button>
                        <button class="action-btn delete-btn" data-user-id="${customer.user_id}" onclick="deleteCustomer(${customer.user_id})">Xóa</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            throw new Error("Dữ liệu khách hàng không hợp lệ.");
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách khách hàng:", error);
        alert("Không thể tải danh sách khách hàng. Vui lòng thử lại: " + error.message);
    }
}

// Hàm xem chi tiết khách hàng (giả sử mở popup hoặc chuyển hướng)
function viewCustomerDetails(userId) {
    console.log("Xem chi tiết khách hàng ID:", userId);
    alert("Xem chi tiết khách hàng " + userId + " (chức năng cần triển khai thêm)");
}

// Hàm cập nhật thông tin khách hàng
async function updateCustomer(userId) {
    const username = prompt("Nhập tên đăng nhập mới:");
    const email = prompt("Nhập email mới:");
    const role = prompt("Nhập vai trò mới (admin/customer):");

    if (!username || !email || !role || !['admin', 'customer'].includes(role)) {
        alert("Dữ liệu không hợp lệ. Vui lòng nhập đầy đủ: tên đăng nhập, email, và vai trò (admin/customer).");
        return;
    }

    try {
        const response = await fetch(`/BE/api/update_customer.php?id=${userId}`, {
            method: 'PUT',
            mode: 'cors',
            body: JSON.stringify({ username, email, role }),
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${await response.text()}`);
        }

        const result = await response.json();
        if (result.success) {
            alert("Cập nhật thông tin khách hàng thành công!");
            loadCustomers(); // Tải lại danh sách khách hàng
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật thông tin khách hàng:", error);
        alert("Không thể cập nhật thông tin. Vui lòng thử lại: " + error.message);
    }
}

// Hàm xóa khách hàng
async function deleteCustomer(userId) {
    if (!confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) return;

    try {
        const response = await fetch(`/BE/api/delete_customer.php?id=${userId}`, {
            method: 'DELETE',
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status} - ${await response.text()}`);
        }

        const result = await response.json();
        if (result.success) {
            alert("Xóa khách hàng thành công!");
            loadCustomers(); // Tải lại danh sách khách hàng
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi khi xóa khách hàng:", error);
        alert("Không thể xóa khách hàng. Vui lòng thử lại: " + error.message);
    }
}