(function() {
  // ... (todo o código de initLunr() e showSearchResults() permanece o mesmo) ...
  function initLunr() {
    fetch('/search.json').then(response => response.json()).then(data => {
        window.searchData = data;
        window.projectIdx = lunr(function() {
          this.pipeline.remove(lunr.stemmer);
          this.pipeline.remove(lunr.stopWordFilter);
          this.ref('id');
          this.field('title', { boost: 10 });
          this.field('aluno');
          this.field('category');
          this.field('premio', { boost: 5 });
          data.forEach((doc, idx) => { doc.id = idx; this.add(doc); });
        });
      }).catch(err => console.error("Erro ao carregar search.json:", err));
    fetch('/taxonomies.json').then(response => response.json()).then(data => {
        window.taxonomyData = data;
        window.taxonomyIdx = lunr(function() {
          this.pipeline.remove(lunr.stemmer);
          this.pipeline.remove(lunr.stopWordFilter);
          this.ref('id');
          this.field('name', { boost: 5 });
          data.forEach((doc, idx) => { doc.id = idx; this.add(doc); });
        });
      }).catch(err => console.error("Erro ao carregar taxonomies.json:", err));
  }
  function showSearchResults() {
    const query = this.value;
    const resultsContainer = document.getElementById('search-results');
    if (!query || query.length < 2 || !projectIdx || !taxonomyIdx) {
      resultsContainer.innerHTML = '';
      resultsContainer.style.display = 'none';
      return;
    }
    const searchQuery = query + '*';
    const projectResults = projectIdx.search(searchQuery);
    const taxonomyResults = taxonomyIdx.search(searchQuery);
    let output = '';
    const sliceLimit = 3;
    if (projectResults.length > 0) {
      output += '<div class="search-result-header">Projetos</div>';
      output += '<ul class="list-group list-group-flush">';
      projectResults.slice(0, sliceLimit).forEach(result => {
        const doc = projectData[result.ref];
        output += `<li class="list-group-item"><a href="${doc.url}">${doc.title}</a><br><small>${doc.aluno}</small></li>`;
      });
      output += '</ul>';
    }
    if (taxonomyResults.length > 0) {
      output += '<div class="search-result-header">Categorias e Tags</div>';
      output += '<ul class="list-group list-group-flush">';
      taxonomyResults.slice(0, sliceLimit).forEach(result => {
        const doc = taxonomyData[result.ref];
        output += `<li class="list-group-item"><a href="${doc.url}">${doc.name} <span class="search-result-type">(${doc.type})</span></a></li>`;
      });
      output += '</ul>';
    }
    const totalResults = projectResults.length + taxonomyResults.length;
    if (totalResults > (sliceLimit * 2)) { 
      output += `<a href="/busca/?q=${encodeURIComponent(query)}" class="search-see-all">Ver todos os ${totalResults} resultados →</a>`;
    }
    if (output === '') {
      output = '<ul class="list-group list-group-flush"><li class="list-group-item">Nenhum resultado encontrado.</li></ul>';
    }
    resultsContainer.innerHTML = output;
    resultsContainer.style.display = 'block';
  }

  // --- O CÓDIGO NOVO COMEÇA AQUI ---
  function initSearch() {
    initLunr();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('keyup', showSearchResults);
    }
    
    // 1. Encontra o formulário pelo ID
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      // 2. Adiciona um "ouvinte" para o evento 'submit' (Enter ou clique)
      searchForm.addEventListener('submit', function(e) {
        // 3. Impede o navegador de recarregar a página
        e.preventDefault(); 
        const query = document.getElementById('search-input').value;
        // 4. Redireciona o usuário para a página de busca com o termo
        window.location.href = '/busca/?q=' + encodeURIComponent(query);
      });
    }
  }
  
  // Roda a função principal de inicialização
  initSearch();
  // --- O CÓDIGO NOVO TERMINA AQUI ---

})();