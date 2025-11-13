// Este script roda APENAS na página /busca/
document.addEventListener('DOMContentLoaded', () => {
  const projectList = document.getElementById('full-project-results-list');
  const taxonomyList = document.getElementById('full-taxonomy-results-list');
  const queryDisplay = document.getElementById('search-query-display');

  if (!projectList || !taxonomyList || !queryDisplay) { return; }

  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  queryDisplay.textContent = query || '';

  if (!query) {
    projectList.innerHTML = '<p class="col-12">Por favor, digite um termo na busca.</p>';
    return;
  }

  let projectIdx, taxonomyIdx, projectData, taxonomyData;

  const loadProjects = fetch('/search.json').then(r => r.json()).then(data => {
    projectData = data;
    projectIdx = lunr(function() {
      this.pipeline.remove(lunr.stemmer); this.pipeline.remove(lunr.stopWordFilter);
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('aluno');
      this.field('category'); // Agora o search.json tem esse campo
      this.field('premio', { boost: 5 });
      data.forEach((doc, idx) => { doc.id = idx; this.add(doc); });
    });
  });

  const loadTaxonomies = fetch('/taxonomies.json').then(r => r.json()).then(data => {
    taxonomyData = data;
    taxonomyIdx = lunr(function() {
      this.pipeline.remove(lunr.stemmer); this.pipeline.remove(lunr.stopWordFilter);
      this.ref('id');
      this.field('name', { boost: 5 });
    });
    data.forEach((doc, idx) => { doc.id = idx; this.add(doc); });
  });

  Promise.all([loadProjects, loadTaxonomies]).then(() => {
    const searchQuery = query + '*';
    const projectResults = projectIdx.search(searchQuery);
    const taxonomyResults = taxonomyIdx.search(searchQuery);

    let projectHTML = '';
    if (projectResults.length > 0) {
      projectResults.forEach(result => {
        const doc = projectData[result.ref];
        
        let awardBadge = '';
        if (doc.premio && doc.premio.trim() !== "") {
          awardBadge = `<span class="award-tag me-2 mb-2">${doc.premio}</span>`;
        }

        // HTML DO CARD CORRIGIDO (classe e variável)
        projectHTML += `
          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <div style="height: 200px; background-color: #eee;"></div>
              <div class="card-body">
                <div class="card-meta-badges">
                  <a href="${doc.category_url}" class="category-badge-outline mb-2">${doc.category}</a>
                  ${awardBadge}
                </div>
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

    let taxonomyHTML = '';
    if (taxonomyResults.length > 0) {
      taxonomyResults.forEach(result => {
        const doc = taxonomyData[result.ref];
        const badgeClass = (doc.type === 'Categoria') ? 'category-badge' : 'archive-tag';
        taxonomyHTML += `<a href="${doc.url}" class="${badgeClass} me-2 mb-2">${doc.name}</a> `;
      });
    } else {
      taxonomyHTML = '<p>Nenhuma tag ou categoria encontrada.</p>';
    }
    taxonomyList.innerHTML = taxonomyHTML;

  }).catch(err => {
     console.error("Erro ao rodar a busca na página:", err);
     projectList.innerHTML = "<p>Ocorreu um erro ao carregar os resultados.</p>";
  });
});