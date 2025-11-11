(function () {
  function initLunr() {
    fetch("/search.json")
      .then((response) => response.json())
      .then((data) => {
        window.searchData = data;
        window.lunrIdx = lunr(function () {
          this.ref("id");
          this.field("title", { boost: 10 });
          this.field("aluno");
          this.field("tags");
          // A linha this.field('content') foi REMOVIDA

          data.forEach(function (doc, idx) {
            doc.id = idx;
            this.add(doc);
          }, this);
        });
      })
      .catch((error) =>
        console.error("Erro ao carregar o search.json:", error),
      );
  }
  function showSearchResults() {
    const query = this.value;
    const resultsContainer = document.getElementById("search-results");
    if (!query || query.length < 2 || !window.lunrIdx) {
      resultsContainer.innerHTML = "";
      resultsContainer.style.display = "none";
      return;
    }
    const results = window.lunrIdx.search(query + "* " + query);
    let output = '<ul class="list-group">';
    const uniqueResults = results.filter(
      (result, index, self) =>
        index === self.findIndex((t) => t.ref === result.ref),
    );
    if (uniqueResults.length === 0) {
      output += '<li class="list-group-item">Nenhum resultado encontrado.</li>';
    } else {
      uniqueResults.slice(0, 5).forEach(function (result) {
        const doc = window.searchData[result.ref];
        output += `<li class="list-group-item"><a href="${doc.url}">${doc.title}</a><br><small>${doc.aluno}</small></li>`;
      });
    }
    output += "</ul>";
    resultsContainer.innerHTML = output;
    resultsContainer.style.display = "block";
  }
  initLunr();
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keyup", showSearchResults);
  }
})();
