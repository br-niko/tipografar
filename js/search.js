(function () {
  let projectIdx = null;
  let taxonomyIdx = null;
  let projectData = [];
  let taxonomyData = [];

  // 1. Carregar o índice de PROJETOS (títulos, alunos)
  fetch("/search.json")
    .then((response) => response.json())
    .then((data) => {
      projectData = data;
      projectIdx = lunr(function () {
        this.pipeline.remove(lunr.stemmer);
        this.pipeline.remove(lunr.stopWordFilter);
        this.ref("id");
        this.field("title", { boost: 10 });
        this.field("aluno");
        data.forEach((doc, idx) => {
          doc.id = idx;
          this.add(doc);
        });
      });
    })
    .catch((err) => console.error("Erro ao carregar search.json:", err));

  // 2. Carregar o índice de TAXONOMIAS (tags, categories)
  fetch("/taxonomies.json")
    .then((response) => response.json())
    .then((data) => {
      taxonomyData = data;
      taxonomyIdx = lunr(function () {
        this.pipeline.remove(lunr.stemmer);
        this.pipeline.remove(lunr.stopWordFilter);
        this.ref("id");
        this.field("name", { boost: 5 });
        data.forEach((doc, idx) => {
          doc.id = idx;
          this.add(doc);
        });
      });
    })
    .catch((err) => console.error("Erro ao carregar taxonomies.json:", err));

  // 3. Função de busca (MODIFICADA)
  function showSearchResults() {
    const query = this.value;
    const resultsContainer = document.getElementById("search-results");

    if (!query || query.length < 2 || !projectIdx || !taxonomyIdx) {
      resultsContainer.innerHTML = "";
      resultsContainer.style.display = "none";
      return;
    }

    const searchQuery = query + "*";
    const projectResults = projectIdx.search(searchQuery);
    const taxonomyResults = taxonomyIdx.search(searchQuery);

    let output = "";
    const sliceLimit = 3; // Nosso limite de quantos itens mostrar no dropdown

    // Seção de Projetos
    if (projectResults.length > 0) {
      output += '<div class="search-result-header">Projetos</div>';
      output += '<ul class="list-group list-group-flush">';
      projectResults.slice(0, sliceLimit).forEach((result) => {
        const doc = projectData[result.ref];
        output += `<li class="list-group-item"><a href="${doc.url}">${doc.title}</a><br><small>${doc.aluno}</small></li>`;
      });
      output += "</ul>";
    }

    // Seção de Categorias e Tags
    if (taxonomyResults.length > 0) {
      output += '<div class="search-result-header">Categorias e Tags</div>';
      output += '<ul class="list-group list-group-flush">';
      taxonomyResults.slice(0, sliceLimit).forEach((result) => {
        const doc = taxonomyData[result.ref];
        output += `<li class="list-group-item"><a href="${doc.url}">${doc.name} <span class="search-result-type">(${doc.type})</span></a></li>`;
      });
      output += "</ul>";
    }

    // --- INÍCIO DA MODIFICAÇÃO ---
    // Seção "Ver Todos"
    const totalResults = projectResults.length + taxonomyResults.length;
    // Mostra o link "Ver todos" se o total for maior que os itens que mostramos (sliceLimit*2)
    if (totalResults > sliceLimit * 2) {
      output += `<a href="/busca/?q=${encodeURIComponent(query)}" class="search-see-all">Ver todos os ${totalResults} resultados →</a>`;
    }
    // --- FIM DA MODIFICAÇÃO ---

    if (output === "") {
      output =
        '<ul class="list-group list-group-flush"><li class="list-group-item">Nenhum resultado encontrado.</li></ul>';
    }

    resultsContainer.innerHTML = output;
    resultsContainer.style.display = "block";
  }

  // Ligar o listener
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keyup", showSearchResults);
  }
})();
