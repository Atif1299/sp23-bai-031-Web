// admin_panel.js

document.addEventListener('DOMContentLoaded', function () {
  // Modal logic
  const addProductBtn = document.getElementById('addProductBtn');
  const productModal = document.getElementById('productModal');
  const closeProductModal = document.getElementById('closeProductModal');
  const productForm = document.getElementById('productForm');
  const productTableBody = document.getElementById('productTableBody');
  let editingProductId = null;
  let deleteProductId = null;
  let deleteProductName = '';
  const deleteModal = document.getElementById('deleteModal');
  const deleteModalText = document.getElementById('deleteModalText');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const statusFilter = document.getElementById('statusFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  let allProducts = [];
  let currentPage = 1;
  const productsPerPage = 5;

  function showModal(modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
  }
  function hideModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }

  // Update add product button click handler
  addProductBtn.onclick = () => {
    editingProductId = null;
    productForm.reset();
    showModal(productModal);
  };

  closeProductModal.onclick = () => hideModal(productModal);

  // Helper to populate product category dropdown
  async function populateProductCategoryDropdown(selectedCategory = '') {
    try {
      const res = await fetch('/admin/categories');
      const categories = await res.json();
      const select = document.getElementById('productCategory');
      select.innerHTML = '<option value="" disabled>Select a category</option>';
      
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        if (category.name === selectedCategory) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Fetch and render products
  function renderProducts(filterStatus, filterCategory) {
    fetch('/admin/products')
      .then(res => res.json())
      .then(products => {
        allProducts = products;
        updateCategoryDropdown(products);

        // Apply filters
        let filtered = products;
        if (filterStatus && filterStatus !== 'All Status') {
          filtered = filtered.filter(p => p.status === filterStatus);
        }
        if (filterCategory && filterCategory !== 'All Categories') {
          filtered = filtered.filter(p => p.category === filterCategory);
        }

        // Pagination logic
        const totalPages = Math.ceil(filtered.length / productsPerPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;
        const startIdx = (currentPage - 1) * productsPerPage;
        const endIdx = startIdx + productsPerPage;
        const pageProducts = filtered.slice(startIdx, endIdx);

        // Render products
        productTableBody.innerHTML = '';
        pageProducts.forEach(product => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><input type="checkbox"></td>
            <td><img src="${product.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;"> ${product.name}</td>
            <td>${product.category || ''}</td>
            <td>₹${product.price ? product.price.toFixed(2) : ''}</td>
            <td><span class="status-badge ${product.status === 'Active' ? 'active' : 'inactive'}">${product.status}</span></td>
            <td>
              <button class="edit-btn" data-id="${product._id}"><i class="ri-edit-2-line"></i></button>
              <button class="delete-btn" data-id="${product._id}"><i class="ri-delete-bin-6-line"></i></button>
            </td>
          `;
          productTableBody.appendChild(tr);
        });

        // Render pagination
        renderPagination(totalPages);
        // Attach edit/delete handlers as before
        document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.onclick = function () {
            const id = btn.getAttribute('data-id');
            fetch(`/admin/products`)
              .then(res => res.json())
              .then(products => {
                const product = products.find(p => p._id === id);
                if (product) {
                  setProductFormValues(product);
                  editingProductId = id;
                  showModal(productModal);
                }
              });
          };
        });
        updateDeleteBtns();
      });
  }
  renderProducts();

  statusFilter.addEventListener('change', function() {
    renderProducts(statusFilter.value, categoryFilter.value);
  });
  categoryFilter.addEventListener('change', function() {
    renderProducts(statusFilter.value, categoryFilter.value);
  });

  // Update edit product function
  function setProductFormValues(product) {
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productHoverImage').value = product.hoverImage || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productStatus').value = product.status || '';
    document.getElementById('quickAdd').checked = !!product.quickAdd;
  }

  // Image picker logic
  let currentImageTarget = null;
  const pickBtns = document.querySelectorAll('.pick-btn');
  const imagePickerModal = document.getElementById('imagePickerModal');
  const imagePickerList = document.getElementById('imagePickerList');
  const closeImagePicker = document.getElementById('closeImagePicker');
  function showImagePicker(targetField) {
    currentImageTarget = targetField;
    imagePickerList.innerHTML = '<div style="width:100%;text-align:center;padding:24px 0;">Loading images...</div>';
    showModal(imagePickerModal);
    fetch('/admin/images').then(res => res.json()).then(images => {
      imagePickerList.innerHTML = '';
      images.forEach(img => {
        const div = document.createElement('div');
        div.style.width = '90px';
        div.style.cursor = 'pointer';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.innerHTML = `<img src="/resources/files/${img}" style="width:70px;height:70px;object-fit:cover;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07);margin-bottom:6px;">` +
          `<span style="font-size:0.92rem;word-break:break-all;color:#444;text-align:center;">${img}</span>`;
        div.onclick = () => {
          document.querySelector(`input[name="${currentImageTarget}"]`).value = `/resources/files/${img}`;
          hideModal(imagePickerModal);
        };
        imagePickerList.appendChild(div);
      });
    });
  }
  pickBtns.forEach(btn => {
    btn.onclick = function () {
      showImagePicker(btn.getAttribute('data-target'));
    };
  });
  closeImagePicker.onclick = () => hideModal(imagePickerModal);

  function showDeleteModal(productId, productName) {
    deleteProductId = productId;
    deleteProductName = productName;
    deleteModalText.textContent = `Do you want to delete "${productName}"?`;
    showModal(deleteModal);
  }
  function hideDeleteModal() {
    hideModal(deleteModal);
    deleteProductId = null;
    deleteProductName = '';
  }
  closeDeleteModal.onclick = hideDeleteModal;
  cancelDeleteBtn.onclick = hideDeleteModal;
  confirmDeleteBtn.onclick = function () {
    if (deleteProductId) {
      fetch(`/admin/products/${deleteProductId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
          hideDeleteModal();
          renderProducts();
        });
    }
  };

  // Update delete button logic to use modal
  function updateDeleteBtns() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = function () {
        const id = btn.getAttribute('data-id');
        fetch(`/admin/products`)
          .then(res => res.json())
          .then(products => {
            const product = products.find(p => p._id === id);
            if (product) {
              showDeleteModal(id, product.name);
            }
          });
      };
    });
  }

  function updateCategoryDropdown(products) {
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    categoryFilter.innerHTML = '<option>All Categories</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  function renderPagination(totalPages) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    } else {
      pagination.style.display = 'flex';
    }

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderProducts(statusFilter.value, categoryFilter.value);
      }
    };
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      if (i === currentPage) pageBtn.classList.add('active');
      pageBtn.onclick = () => {
        currentPage = i;
        renderProducts(statusFilter.value, categoryFilter.value);
      };
      pagination.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderProducts(statusFilter.value, categoryFilter.value);
      }
    };
    pagination.appendChild(nextBtn);
  }

  productForm.onsubmit = function(e) {
    e.preventDefault();
    const formData = new FormData(productForm);
    const data = {};
    formData.forEach((v, k) => {
      if (k === 'quickAdd') {
        data[k] = productForm.quickAdd.checked;
      } else {
        data[k] = v;
      }
    });
    const method = editingProductId ? 'PUT' : 'POST';
    const url = editingProductId ? `/admin/products/${editingProductId}` : '/admin/products';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          alert('Error: ' + result.error + (result.details ? '\n' + result.details : ''));
        } else {
          hideModal(productModal);
          currentPage = 1; // Always go to first page after add
          renderProducts();
        }
      });
  };

  // Contact Messages logic
  const contactMessagesSection = document.getElementById('contactMessagesSection');
  const messagesTableBody = document.getElementById('messagesTableBody');
  const sidebarNav = document.querySelector('.sidebar-nav');
  const productsSection = document.querySelector('.admin-header'); // first header is for products

  function renderMessages() {
    fetch('/admin/messages')
      .then(res => res.json())
      .then(messages => {
        messagesTableBody.innerHTML = '';
        messages.forEach(msg => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${msg.type === 'order' ? 'Order' : 'Contact'}</td>
            <td>${msg.subject}</td>
            <td>${msg.userEmail || ''}</td>
            <td>${new Date(msg.createdAt).toLocaleString()}</td>
            <td style="white-space:pre-line;max-width:320px;">${msg.body}</td>
          `;
          messagesTableBody.appendChild(tr);
        });
      });
  }

  // Sidebar navigation logic
  sidebarNav.querySelectorAll('li').forEach((li, idx) => {
    li.onclick = function() {
      sidebarNav.querySelectorAll('li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');
      if (li.textContent.includes('Contact Messages')) {
        document.querySelector('.admin-header').style.display = 'none';
        document.querySelector('.admin-filters').style.display = 'none';
        document.querySelector('.admin-table').style.display = 'none';
        document.querySelector('.pagination').style.display = 'none';
        contactMessagesSection.style.display = '';
        renderMessages();
      } else if (li.textContent.includes('Products')) {
        document.querySelector('.admin-header').style.display = '';
        document.querySelector('.admin-filters').style.display = '';
        document.querySelector('.admin-table').style.display = '';
        document.querySelector('.pagination').style.display = '';
        contactMessagesSection.style.display = 'none';
      } else {
        // Hide all for other tabs
        document.querySelector('.admin-header').style.display = 'none';
        document.querySelector('.admin-filters').style.display = 'none';
        document.querySelector('.admin-table').style.display = 'none';
        document.querySelector('.pagination').style.display = 'none';
        contactMessagesSection.style.display = 'none';
      }
    };
  });
}); 