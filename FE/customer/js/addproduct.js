document.addEventListener("DOMContentLoaded", function () {
    // Load danh mục vào select
    fetch("/BE/api/get_categories.php")
        .then(response => response.json())
        .then(data => {
            let categorySelect = document.getElementById("category");

            if (data.success === false) {
                alert(data.message);
                return;
            }

            data.forEach(category => {
                let option = document.createElement("option");
                option.value = category.category_id;
                option.textContent = category.category_name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => console.error("Lỗi tải danh mục:", error));
});

document.getElementById("addProductForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    let formData = new FormData();
    formData.append("productName", document.getElementById("productName").value);
    formData.append("productPrice", document.getElementById("productPrice").value);
    formData.append("productDescription", document.getElementById("productDescription").value);
    formData.append("category_id", document.getElementById("category").value);
    formData.append("productImage", document.getElementById("productImage").files[0]);

    try {
        let response = await fetch("/BE/api/add_product.php", {
            method: "POST",
            body: formData
        });

        let result = await response.json();
        console.log(result);

        if (result.success) {
            alert("Thêm sản phẩm thành công!");
            document.getElementById("addProductForm").reset();
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Lỗi khi gửi dữ liệu!");
    }
});
