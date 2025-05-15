/**
 * Permissions Management Module
 * Chứa các chức năng xử lý cho trang phân quyền người dùng
 */

const PermissionsModule = (function() {
    // Các biến private
    let rolesList = [];
    let permissionsList = [];
    
    // Element references
    const selectors = {
        roleTabs: '.role-tabs .role-tab',
        roleContent: '.role-content',
        permissionCheckboxes: '.permission-item input[type="checkbox"]',
        savePermissionsBtn: '.save-permissions-btn',
        addRoleBtn: '.add-role-btn',
        deleteRoleBtn: '.delete-role-btn',
        editRoleBtn: '.edit-role-btn',
        roleNameInput: '.role-name-input',
        roleDescInput: '.role-desc-input',
        checkAllBtn: '.check-all-btn',
        uncheckAllBtn: '.uncheck-all-btn',
        searchInput: '.search-box input',
        searchButton: '.search-box button',
        permissionGroups: '.permission-group'
    };
    
    /**
     * Khởi tạo module
     */
    function init() {
        console.log('Permissions module initialized');
        
        // Tải dữ liệu vai trò
        loadRoles();
        
        // Tải dữ liệu quyền
        loadPermissions();
        
        // Thiết lập các sự kiện
        setupEventListeners();
    }
    
    /**
     * Thiết lập các event listeners
     */
    function setupEventListeners() {
        // Tab vai trò
        const roleTabs = document.querySelectorAll(selectors.roleTabs);
        if (roleTabs.length > 0) {
            roleTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    switchRoleTab(tab);
                });
            });
        }
        
        // Nút lưu quyền
        const savePermissionsBtn = document.querySelector(selectors.savePermissionsBtn);
        if (savePermissionsBtn) {
            savePermissionsBtn.addEventListener('click', savePermissions);
        }
        
        // Nút thêm vai trò
        const addRoleBtn = document.querySelector(selectors.addRoleBtn);
        if (addRoleBtn) {
            addRoleBtn.addEventListener('click', showAddRoleForm);
        }
        
        // Nút xóa vai trò
        const deleteRoleBtn = document.querySelector(selectors.deleteRoleBtn);
        if (deleteRoleBtn) {
            deleteRoleBtn.addEventListener('click', deleteRole);
        }
        
        // Nút chỉnh sửa vai trò
        const editRoleBtn = document.querySelector(selectors.editRoleBtn);
        if (editRoleBtn) {
            editRoleBtn.addEventListener('click', editRole);
        }
        
        // Nút chọn tất cả quyền
        const checkAllBtn = document.querySelector(selectors.checkAllBtn);
        if (checkAllBtn) {
            checkAllBtn.addEventListener('click', checkAllPermissions);
        }
        
        // Nút bỏ chọn tất cả quyền
        const uncheckAllBtn = document.querySelector(selectors.uncheckAllBtn);
        if (uncheckAllBtn) {
            uncheckAllBtn.addEventListener('click', uncheckAllPermissions);
        }
        
        // Tìm kiếm quyền
        const searchInput = document.querySelector(selectors.searchInput);
        const searchButton = document.querySelector(selectors.searchButton);
        
        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    searchPermissions(searchInput.value);
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                searchPermissions(searchInput.value);
            });
        }
        
        // Sự kiện cho các checkbox quyền
        setupPermissionCheckboxes();
    }
    
    /**
     * Tải dữ liệu vai trò
     */
    function loadRoles() {
        console.log('Loading roles');
        
        // Trong triển khai thực tế, đây sẽ là một API call
        // Hiện tại, chúng ta sử dụng dữ liệu giả lập từ HTML
    }
    
    /**
     * Tải dữ liệu quyền
     */
    function loadPermissions() {
        console.log('Loading permissions');
        
        // Trong triển khai thực tế, đây sẽ là một API call
        // Hiện tại, chúng ta sử dụng dữ liệu giả lập từ HTML
    }
    
    /**
     * Chuyển đổi tab vai trò
     */
    function switchRoleTab(tab) {
        // Xóa lớp active từ tất cả các tab
        const allTabs = document.querySelectorAll(selectors.roleTabs);
        allTabs.forEach(t => t.classList.remove('active'));
        
        // Thêm lớp active cho tab được chọn
        tab.classList.add('active');
        
        // Lấy ID vai trò từ tab
        const roleId = tab.getAttribute('data-role-id');
        
        // Làm hiện nội dung tương ứng
        showRolePermissions(roleId);
        
        console.log(`Switched to role: ${tab.textContent.trim()} (ID: ${roleId})`);
    }
    
    /**
     * Hiển thị quyền của vai trò
     */
    function showRolePermissions(roleId) {
        console.log(`Loading permissions for role ID: ${roleId}`);
        
        // Trong triển khai thực tế, đây sẽ tải dữ liệu quyền cho vai trò cụ thể
        // Hiện tại, chúng ta giả lập bằng cách hiển thị/ẩn phần tử
        
        // Ẩn tất cả nội dung vai trò
        const allContents = document.querySelectorAll(selectors.roleContent);
        allContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Hiển thị nội dung vai trò được chọn
        const selectedContent = document.querySelector(`.role-content[data-role-id="${roleId}"]`);
        if (selectedContent) {
            selectedContent.style.display = 'block';
        }
    }
    
    /**
     * Thiết lập các checkbox quyền
     */
    function setupPermissionCheckboxes() {
        const permissionCheckboxes = document.querySelectorAll(selectors.permissionCheckboxes);
        
        if (permissionCheckboxes.length > 0) {
            permissionCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    // Trong triển khai thực tế, đây có thể cập nhật trạng thái quyền ở phía client
                    const permissionId = checkbox.getAttribute('data-permission-id');
                    const isChecked = checkbox.checked;
                    const permissionName = checkbox.closest('.permission-item').querySelector('label').textContent;
                    
                    console.log(`Permission ${permissionName} (ID: ${permissionId}) ${isChecked ? 'granted' : 'revoked'}`);
                    
                    // Kiểm tra nếu đây là checkbox nhóm
                    const isGroupCheckbox = checkbox.classList.contains('group-checkbox');
                    if (isGroupCheckbox) {
                        // Tìm tất cả checkbox con trong nhóm và đặt cùng trạng thái
                        const group = checkbox.closest('.permission-group');
                        const childCheckboxes = group.querySelectorAll('.permission-items input[type="checkbox"]');
                        
                        childCheckboxes.forEach(child => {
                            child.checked = isChecked;
                        });
                    }
                });
            });
        }
    }
    
    /**
     * Lưu phân quyền
     */
    function savePermissions() {
        console.log('Saving permissions');
        
        // Lấy vai trò hiện tại
        const activeTab = document.querySelector(`${selectors.roleTabs}.active`);
        if (!activeTab) {
            console.error('No active role tab found');
            return;
        }
        
        const roleId = activeTab.getAttribute('data-role-id');
        const roleName = activeTab.textContent.trim();
        
        // Lấy tất cả quyền đã chọn cho vai trò
        const checkedPermissions = [];
        const permissionCheckboxes = document.querySelectorAll(`.role-content[data-role-id="${roleId}"] ${selectors.permissionCheckboxes}`);
        
        permissionCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkedPermissions.push({
                    id: checkbox.getAttribute('data-permission-id'),
                    name: checkbox.closest('.permission-item').querySelector('label').textContent
                });
            }
        });
        
        console.log(`Saving ${checkedPermissions.length} permissions for role ${roleName} (ID: ${roleId})`);
        
        // Hiển thị thông báo đang xử lý
        if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
            CommonModule.showNotification('Đang lưu phân quyền...', 'info');
        } else {
            alert('Đang lưu phân quyền...');
        }
        
        // Giả lập lưu
        setTimeout(function() {
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification('Lưu phân quyền thành công!', 'success');
            } else {
                alert('Lưu phân quyền thành công!');
            }
        }, 1500);
        
        // Trong triển khai thực tế, đây sẽ gửi dữ liệu qua API
    }
    
    /**
     * Hiển thị form thêm vai trò
     */
    function showAddRoleForm() {
        console.log('Show add role form');
        
        // Trong triển khai thực tế, đây sẽ hiển thị modal hoặc form
        const roleName = prompt('Nhập tên vai trò mới:');
        if (roleName) {
            const roleDesc = prompt('Nhập mô tả cho vai trò:');
            
            // Giả lập thêm vai trò
            addRole(roleName, roleDesc);
        }
    }
    
    /**
     * Thêm vai trò mới
     */
    function addRole(name, description) {
        console.log(`Adding new role: ${name}`);
        
        // Giả lập tạo ID mới
        const newRoleId = Date.now().toString();
        
        // Hiển thị thông báo thành công
        if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
            CommonModule.showNotification(`Đã thêm vai trò "${name}"`, 'success');
        } else {
            alert(`Đã thêm vai trò "${name}"`);
        }
        
        // Trong triển khai thực tế, đây sẽ gửi dữ liệu qua API
        // Sau đó tải lại trang hoặc cập nhật UI để hiển thị vai trò mới
        
        // Làm mới trang để hiển thị vai trò mới
        // window.location.reload();
    }
    
    /**
     * Xóa vai trò
     */
    function deleteRole() {
        // Lấy vai trò hiện tại
        const activeTab = document.querySelector(`${selectors.roleTabs}.active`);
        if (!activeTab) {
            console.error('No active role tab found');
            return;
        }
        
        const roleId = activeTab.getAttribute('data-role-id');
        const roleName = activeTab.textContent.trim();
        
        // Xác nhận xóa
        if (confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleName}"?`)) {
            console.log(`Deleting role: ${roleName} (ID: ${roleId})`);
            
            // Hiển thị thông báo thành công
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification(`Đã xóa vai trò "${roleName}"`, 'success');
            } else {
                alert(`Đã xóa vai trò "${roleName}"`);
            }
            
            // Trong triển khai thực tế, đây sẽ gửi dữ liệu qua API
            // Sau đó tải lại trang hoặc cập nhật UI để xóa vai trò
            
            // Làm mới trang để cập nhật UI
            // window.location.reload();
        }
    }
    
    /**
     * Chỉnh sửa vai trò
     */
    function editRole() {
        // Lấy vai trò hiện tại
        const activeTab = document.querySelector(`${selectors.roleTabs}.active`);
        if (!activeTab) {
            console.error('No active role tab found');
            return;
        }
        
        const roleId = activeTab.getAttribute('data-role-id');
        const roleName = activeTab.textContent.trim();
        
        // Trong triển khai thực tế, đây sẽ lấy mô tả hiện tại từ dữ liệu
        // Hiện tại, chúng ta giả lập
        const currentDesc = '';
        
        const newName = prompt('Nhập tên vai trò mới:', roleName);
        if (newName) {
            const newDesc = prompt('Nhập mô tả mới cho vai trò:', currentDesc);
            
            console.log(`Editing role ${roleName} to ${newName} (ID: ${roleId})`);
            
            // Hiển thị thông báo thành công
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification(`Đã cập nhật vai trò "${newName}"`, 'success');
            } else {
                alert(`Đã cập nhật vai trò "${newName}"`);
            }
            
            // Trong triển khai thực tế, đây sẽ gửi dữ liệu qua API
            // Sau đó tải lại trang hoặc cập nhật UI
            
            // Cập nhật tên hiển thị ngay trên tab
            activeTab.textContent = newName;
        }
    }
    
    /**
     * Chọn tất cả quyền
     */
    function checkAllPermissions() {
        // Lấy vai trò hiện tại
        const activeTab = document.querySelector(`${selectors.roleTabs}.active`);
        if (!activeTab) {
            console.error('No active role tab found');
            return;
        }
        
        const roleId = activeTab.getAttribute('data-role-id');
        
        // Tìm tất cả checkbox quyền của vai trò hiện tại
        const permissionCheckboxes = document.querySelectorAll(`.role-content[data-role-id="${roleId}"] ${selectors.permissionCheckboxes}`);
        
        // Chọn tất cả
        permissionCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        console.log('All permissions checked');
    }
    
    /**
     * Bỏ chọn tất cả quyền
     */
    function uncheckAllPermissions() {
        // Lấy vai trò hiện tại
        const activeTab = document.querySelector(`${selectors.roleTabs}.active`);
        if (!activeTab) {
            console.error('No active role tab found');
            return;
        }
        
        const roleId = activeTab.getAttribute('data-role-id');
        
        // Tìm tất cả checkbox quyền của vai trò hiện tại
        const permissionCheckboxes = document.querySelectorAll(`.role-content[data-role-id="${roleId}"] ${selectors.permissionCheckboxes}`);
        
        // Bỏ chọn tất cả
        permissionCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        console.log('All permissions unchecked');
    }
    
    /**
     * Tìm kiếm quyền
     */
    function searchPermissions(keyword) {
        console.log('Searching permissions with keyword:', keyword);
        
        // Lấy vai trò hiện tại
        const activeTab = document.querySelector(`${selectors.roleTabs}.active`);
        if (!activeTab) {
            console.error('No active role tab found');
            return;
        }
        
        const roleId = activeTab.getAttribute('data-role-id');
        
        // Tìm tất cả các mục quyền
        const permissionItems = document.querySelectorAll(`.role-content[data-role-id="${roleId}"] .permission-item`);
        
        if (permissionItems.length > 0) {
            keyword = keyword.toLowerCase();
            
            // Reset hiển thị tất cả các nhóm quyền
            const permissionGroups = document.querySelectorAll(`.role-content[data-role-id="${roleId}"] ${selectors.permissionGroups}`);
            permissionGroups.forEach(group => {
                group.style.display = '';
            });
            
            // Lọc các mục quyền
            let found = false;
            permissionItems.forEach(item => {
                const permissionText = item.querySelector('label').textContent.toLowerCase();
                
                if (permissionText.includes(keyword)) {
                    item.style.display = '';
                    item.style.backgroundColor = keyword ? '#fffde7' : ''; // Highlight nếu tìm thấy
                    found = true;
                    
                    // Đảm bảo nhóm chứa mục này được hiển thị
                    const group = item.closest('.permission-group');
                    if (group) {
                        group.style.display = '';
                    }
                } else {
                    item.style.display = keyword ? 'none' : ''; // Ẩn nếu không khớp và đang tìm kiếm
                    item.style.backgroundColor = '';
                }
            });
            
            // Ẩn các nhóm không có mục nào khớp
            permissionGroups.forEach(group => {
                const visibleItems = group.querySelectorAll('.permission-item[style="display: ;"], .permission-item[style="background-color: rgb(255, 253, 231);"]');
                if (visibleItems.length === 0 && keyword) {
                    group.style.display = 'none';
                }
            });
            
            if (!found && keyword) {
                // Hiển thị thông báo không tìm thấy
                if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                    CommonModule.showNotification(`Không tìm thấy quyền nào khớp với "${keyword}"`, 'warning');
                } else {
                    alert(`Không tìm thấy quyền nào khớp với "${keyword}"`);
                }
            }
        }
    }
    
    // API công khai của module
    return {
        init: init,
        savePermissions: savePermissions,
        addRole: addRole,
        editRole: editRole,
        deleteRole: deleteRole
    };
})();

// Tự động khởi tạo module khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    PermissionsModule.init();
});
