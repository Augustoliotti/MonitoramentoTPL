class CustomSidebar extends HTMLElement {
  connectedCallback() {
    // Pega apenas o nome do arquivo atual (ex: frota.html)
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    // Função simples para marcar ativo
    const isActive = (path) => currentPath === path ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-500 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors';
    
    this.innerHTML = `
      <aside class="w-64 bg-white h-full flex flex-col border-r border-slate-200 flex-shrink-0 z-30 hidden md:flex transition-all duration-300">
        
        <div class="h-16 flex items-center px-6 border-b border-slate-100">
          <div class="flex items-center gap-2 text-emerald-600">
            <i data-feather="box" class="w-6 h-6 fill-current"></i>
            <span class="text-lg font-bold text-slate-800 tracking-tight">AgroFleet</span>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div class="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Principal</div>
          
          <a href="index.html" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive('index.html')}">
            <i data-feather="pie-chart" class="w-5 h-5"></i>
            Dashboard
          </a>
          
          <a href="frota.html" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive('frota.html')}">
            <i data-feather="truck" class="w-5 h-5"></i>
            Diário de Operações
          </a>

          <a href="operacoes.html" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive('operacoes.html')}">
            <i data-feather="activity" class="w-5 h-5"></i>
            Operações
          </a>

           <a href="grupos.html" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive('grupos.html')}">
            <i data-feather="grid" class="w-5 h-5"></i>
            Grupos/Frentes
          </a>

          <div class="px-3 mb-2 mt-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Gerenciamento</div>

          <a href="equipes.html" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive('equipes.html')}">
            <i data-feather="users" class="w-5 h-5"></i>
            Equipes
          </a>
          
          <a href="configuracoes.html" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive('configuracoes.html')}">
            <i data-feather="settings" class="w-5 h-5"></i>
            Configurações
          </a>
          
           <a href="ordens.html" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive('ordens.html')}">
            <i data-feather="file-text" class="w-5 h-5"></i>
            Ordens de Serviço
          </a>
        </nav>

        <div class="p-4 border-t border-slate-100">
          <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">AD</div>
            <div class="overflow-hidden">
              <p class="text-xs font-bold text-slate-700 truncate">Admin User</p>
            </div>
          </div>
        </div>
      </aside>
    `;
    
    if (typeof feather !== 'undefined') feather.replace();
  }
}
customElements.define('custom-sidebar', CustomSidebar);