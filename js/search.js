(function() {
  // 1. Definir variáveis no escopo global do IIFE
  let projectIdx = null;
  let taxonomyIdx = null;
  let projectData = [];
  let taxonomyData = [];

  // 2. Carregar os índices IMEDIATAMENTE.
  fetch('/search.json')
    .then(response => response.json())
    .then(data => {
      projectData = data;
      projectIdx = lunr(function() {
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

  fetch('/taxonomies.json')
    .then(response => response.json())
    .then(data => {
      taxonomyData = data;
      taxonomyIdx = lunr(function() {
        this.pipeline.remove(lunr.stemmer);
        this.pipeline.remove(lunr.stopWordFilter);
        this.ref('id');
        this.field('name', { boost: 5 });
        data.forEach((doc, idx) => { doc.id = idx; this.add(doc); });
      });
    }).catch(err => console.error("Erro ao carregar taxonomies.json:", err));

  // 3. Definir a função do autocomplete
  function showSearchResults() {
    const query = this.value;
    const resultsContainer = document.getElementById('search-results');
    
    // Checar se os índices estão prontos!
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

  // 4. Ligar os "ouvintes" (listeners)
  
  // Ligar o ouvinte do Autocomplete (quando o usuário digita)
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', showSearchResults);
  }
  
  // Ligar o ouvinte do "Enter" (quando o usuário envia o formulário)
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault(); 
      const query = document.getElementById('search-input').value;
      window.location.href = '/busca/?q=' + encodeURIComponent(query);
    });
  }

})();