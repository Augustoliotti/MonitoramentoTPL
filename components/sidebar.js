class CustomSidebar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .sidebar {
          width: 250px;
          transition: transform 0.3s ease;
        }
        .sidebar-link {
          transition: all 0.2s ease;
        }
        .sidebar-link:hover {
          background-color: rgba(16, 185, 129, 0.1);
        }
        .sidebar-link.active {
          background-color: rgba(16, 185, 129, 0.1);
          border-left: 3px solid #10b981;
          color: #10b981;
        }
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            position: fixed;
            height: calc(100vh - 64px);
            top: 64px;
            z-index: 10;
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }
      </style>
      <div class="sidebar bg-white h-screen fixed lg:static shadow-sm flex-shrink-0">
        <div class="p-4">
          <div class="space-y-1">
            <a href="index.html" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700">
              <i data-feather="home" class="mr-3"></i>
              Dashboard
            </a>
            
            <a href="frota.html" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700">
              <i data-feather="truck" class="mr-3"></i>
              Frota
            </a>
            
            <a href="operacoes.html" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700">
              <i data-feather="activity" class="mr-3"></i>
              Operações
            </a>
            
            <a href="grupos.html" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700">
              <i data-feather="users" class="mr-3"></i>
              Grupos/Frentes
            </a>
            
            <a href="ordens.html" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700">
              <i data-feather="file-text" class="mr-3"></i>
              O.S.
            </a>
            
            <div class="pt-4 mt-4 border-t border-gray-200">
              <a href="#" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700">
                <i data-feather="settings" class="mr-3"></i>
                Configurações
              </a>
              
              <a href="#" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700">
                <i data-feather="help-circle" class="mr-3"></i>
                Ajuda
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('custom-sidebar', CustomSidebar);