document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Sidebar toggle functionality for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('-translate-x-full');
        });
    }

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // Date picker initialization
    const datePickers = document.querySelectorAll('.datepicker');
    datePickers.forEach(function(datePicker) {
        new Datepicker(datePicker, {
            format: 'dd/mm/yyyy',
            autohide: true
        });
    });

    // Toast notifications
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    toastElList.map(function(toastEl) {
        return new bootstrap.Toast(toastEl).show();
    });

    // Feather icons replacement
    feather.replace();
});

// Function to show confirmation modal before deletion
function confirmDelete(itemName) {
    return confirm(`Tem certeza que deseja excluir ${itemName}? Esta ação não pode ser desfeita.`);
}

// Function to toggle dropdown menus
function toggleDropdown(dropdownId) {
    document.getElementById(dropdownId).classList.toggle('hidden');
}

// Close dropdowns when clicking outside
window.onclick = function(event) {
    if (!event.target.matches('.dropdown-toggle')) {
        const dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (!openDropdown.classList.contains('hidden')) {
                openDropdown.classList.add('hidden');
            }
        }
    }
}