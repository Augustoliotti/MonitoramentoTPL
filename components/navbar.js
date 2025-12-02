class CustomNavbar extends HTMLElement {
  connectedCallback() {
    // Usamos innerHTML direto para pegar os estilos globais (Tailwind/CSS)
    // Sem Shadow DOM, evitando erros de importação e estilos quebrados
    this.innerHTML = `
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 flex-shrink-0">
        
        <div class="flex items-center gap-4">
          <button class="md:hidden text-slate-500 hover:text-slate-700">
            <i data-feather="menu" class="w-6 h-6"></i>
          </button>
          
          <div class="flex items-center text-sm text-slate-500">
            <span class="font-bold text-slate-800 text-lg tracking-tight">AgroFleet</span>
            <span class="mx-2 text-slate-300">|</span>
            <span class="text-slate-600">Commander</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wide">Sistema Ativo</span>
          </div>

          <div class="h-6 w-px bg-slate-200"></div>

          <button class="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-slate-50">
            <i data-feather="bell" class="w-5 h-5"></i>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>
    `;
    
    // Recarrega os ícones para garantir que apareçam
    if (typeof feather !== 'undefined') feather.replace();
  }
}
customElements.define('custom-navbar', CustomNavbar);