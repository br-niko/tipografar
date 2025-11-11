(function () {
  // Duas variáveis para nossos índices
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
        this.ref("id");
        this.field("name", { boost: 5 });
        data.forEach((doc, idx) => {
          doc.id = idx;
          this.add(doc);
        });
      });
    })
    .catch((err) => console.error("Erro ao carregar taxonomies.json:", err));

  // 3. Função de busca (agora busca em DOIS índices)
  function showSearchResults() {
    const query = this.value;
    const resultsContainer = document.getElementById("search-results");

    if (!query || query.length < 2 || !projectIdx || !taxonomyIdx) {
      resultsContainer.innerHTML = "";
      resultsContainer.style.display = "none";
      return;
    }

    const searchQuery = query + "* " + query;
    const projectResults = projectIdx.search(searchQuery);
    const taxonomyResults = taxonomyIdx.search(searchQuery);

    let output = "";

    // Seção de Projetos
    if (projectResults.length > 0) {
      output += '<div class="search-result-header">Projetos</div>';
      // list-group-flush remove as bordas/linhas
      output += '<ul class="list-group list-group-flush">';
      projectResults.slice(0, 3).forEach((result) => {
        const doc = projectData[result.ref];
        output += `<li class="list-group-item"><a href="${doc.url}">${doc.title}</a><br><small>${doc.aluno}</small></li>`;
      });
      output += "</ul>";
    }

    // Seção de Categorias e Tags
    if (taxonomyResults.length > 0) {
      output += '<div class="search-result-header">Categorias e Tags</div>';
      output += '<ul class="list-group list-group-flush">';
      taxonomyResults.slice(0, 3).forEach((result) => {
        const doc = taxonomyData[result.ref];
        output += `<li class="list-group-item"><a href="${doc.url}">${doc.name} <span class="search-result-type">(${doc.type})</span></a></li>`;
      });
      output += "</ul>";
    }

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
