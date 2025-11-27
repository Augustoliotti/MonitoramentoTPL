class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .navbar {
          height: 64px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        .profile-dropdown {
          min-width: 200px;
        }
        @media (max-width: 768px) {
          .navbar-brand {
            font-size: 1rem;
          }
        }
      </style>
      <nav class="navbar bg-white fixed w-full z-10 px-6 flex items-center justify-between">
        <div class="flex items-center">
          <button id="sidebarToggle" class="mr-4 text-gray-500 focus:outline-none lg:hidden">
            <i data-feather="menu"></i>
          </button>
          <a href="index.html" class="navbar-brand text-xl font-semibold text-gray-800">
            AgroFleet Commander
          </a>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="relative">
            <button class="p-2 text-gray-500 hover:text-gray-700 focus:outline-none">
              <i data-feather="bell"></i>
            </button>
            <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
          
          <div class="relative">
            <button id="profileDropdownButton" class="flex items-center space-x-2 focus:outline-none">
              <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <i data-feather="user" class="text-gray-600"></i>
              </div>
              <span class="hidden md:inline text-gray-700">Admin</span>
              <i data-feather="chevron-down" class="text-gray-500 w-4 h-4"></i>
            </button>
            
            <div id="profileDropdown" class="profile-dropdown hidden absolute right-0 mt-2 bg-white rounded-lg shadow-lg py-2 z-20">
              <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                <i data-feather="user" class="mr-2"></i> Perfil
              </a>
              <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                <i data-feather="settings" class="mr-2"></i> Configurações
              </a>
              <div class="border-t border-gray-200 my-1"></div>
              <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                <i data-feather="log-out" class="mr-2"></i> Sair
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      <script>
        document.getElementById('profileDropdownButton').addEventListener('click', function() {
          document.getElementById('profileDropdown').classList.toggle('hidden');
        });
      </script>
    `;
  }
}
customElements.define('custom-navbar', CustomNavbar);