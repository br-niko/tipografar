// Este script roda APENAS na página /busca/
document.addEventListener("DOMContentLoaded", () => {
  const projectList = document.getElementById("full-project-results-list");
  const taxonomyList = document.getElementById("full-taxonomy-results-list");
  const queryDisplay = document.getElementById("search-query-display");

  // Se não estamos na página de busca, não faz nada
  if (!projectList || !taxonomyList || !queryDisplay) {
    return;
  }

  // 1. Pegar o termo da URL (ex: /busca/?q=lettering)
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("q");
  queryDisplay.textContent = query || "";

  if (!query) {
    // A CORREÇÃO ESTÁ AQUI: aspas simples '...' por dentro
    projectList.innerHTML =
      '<p class="col-12">Por favor, digite um termo na busca.</p>';
    return;
  }

  // 2. Inicializar os índices (copiado de search.js)
  let projectIdx, taxonomyIdx, projectData, taxonomyData;

  const loadProjects = fetch("/search.json")
    .then((r) => r.json())
    .then((data) => {
      projectData = data;
      projectIdx = lunr(function () {
        this.pipeline.remove(lunr.stemmer);
        this.pipeline.remove(lunr.stopWordFilter);
        this.ref("id");
        this.field("title", { boost: 10 });
        this.field("aluno");
      });
      data.forEach((doc, idx) => {
        doc.id = idx;
        this.add(doc);
      });
    });

  const loadTaxonomies = fetch("/taxonomies.json")
    .then((r) => r.json())
    .then((data) => {
      taxonomyData = data;
      taxonomyIdx = lunr(function () {
        this.pipeline.remove(lunr.stemmer);
        this.pipeline.remove(lunr.stopWordFilter);
        this.ref("id");
        this.field("name", { boost: 5 });
      });
      data.forEach((doc, idx) => {
        doc.id = idx;
        this.add(doc);
      });
    });

  // 3. Quando TUDO estiver carregado, rodar a busca
  Promise.all([loadProjects, loadTaxonomies])
    .then(() => {
      const searchQuery = query + "*";
      const projectResults = projectIdx.search(searchQuery);
      const taxonomyResults = taxonomyIdx.search(searchQuery);

      // 4. Construir o HTML dos Projetos (em formato de card)
      let projectHTML = "";
      if (projectResults.length > 0) {
        projectResults.forEach((result) => {
          const doc = projectData[result.ref];
          projectHTML += `
          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <div style="height: 200px; background-color: #eee;"></div>
              <div class="card-body">
                <h5 class="card-title">
                  <a href="${doc.url}" class="text-decoration-none">${doc.title}</a>
                </h5>
                <p class="card-text"><small>${doc.aluno}</small></p>
              </div>
            </div>
          </div>`;
        });
      } else {
        projectHTML = '<p class="col-12">Nenhum projeto encontrado.</p>';
      }
      projectList.innerHTML = projectHTML;

      // 5. Construir o HTML das Tags/Categorias (em formato de badge)
      let taxonomyHTML = "";
      if (taxonomyResults.length > 0) {
        taxonomyResults.forEach((result) => {
          const doc = taxonomyData[result.ref];
          const badgeClass =
            doc.type === "Categoria" ? "category-badge" : "archive-tag";
          taxonomyHTML += `<a href="${doc.url}" class="${badgeClass} me-2 mb-2">${doc.name}</a> `;
        });
      } else {
        taxonomyHTML = "<p>Nenhuma tag ou categoria encontrada.</p>";
      }
      taxonomyList.innerHTML = taxonomyHTML;
    })
    .catch((err) => {
      console.error("Erro ao rodar a busca na página:", err);
      projectList.innerHTML =
        "<p>Ocorreu um erro ao carregar os resultados.</p>";
    });
});
