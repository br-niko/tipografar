// ARQUIVO: assets/js/search.js (VERSÃO FINAL E ROBUSTA)

var idx;
var store = [];
const MIN_CHARS_FOR_SEARCH = 1;

// --- 1. FUNÇÕES GERAIS ---

function loadIndex() {
  // Busca estática pelo nome final do arquivo, gerado pelo search_data.html
  fetch("/search.json")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      store = data;

      idx = lunr(function () {
        this.ref("id");
        this.field("title", { boost: 10 });
        this.field("student", { boost: 5 });
        this.field("period", { boost: 8 });
        this.field("tags");
        this.field("categories");
        this.field("content");

        data.forEach(function (doc, index) {
          doc.id = index;
          this.add(doc);
        }, this);
      });
      console.log("Lunr Index Loaded.");
    })
    .catch(function (error) {
      console.error("Error loading search index:", error);
    });
}

// Função para exibir resultados (Usada na página busca.html)
function displayResults(results, containerId) {
  var resultsContainer = document.getElementById(containerId);
  var html = "";
  var limit = 20;

  if (results.length) {
    for (var i = 0; i < Math.min(results.length, limit); i++) {
      var item = store[results[i].ref];
      var projectURL = item.url;

      html += '<div class="col-md-3 mb-4">';
      html +=
        '<a href="' + projectURL + '" class="text-decoration-none text-body">';
      html += '<div class="card text-center">';
      html += '<div class="project-cover-mask">';
      html +=
        '<img class="card-img-top" src="' +
        item.thumbnail +
        '" alt="' +
        item.title +
        '">';
      html += "</div>";
      html += '<div class="card-body border-0 rounded-0 pl-0 pt-1">';
      html += '<p class="card-text text-left">';
      html += "<b>" + item.title + "</b><br>" + item.student;
      html += "</p>";
      html += "</div></div></a></div>";
    }
  } else {
    html =
      '<p class="text-center text-muted col-12">Nenhum projeto encontrado. Tente outros termos.</p>';
  }

  resultsContainer.innerHTML = html;
}

// Função para exibir a lista de sugestões (Autocomplete)
function displaySuggestions(results) {
  var resultsContainer = document.getElementById("quick-search-results");
  var html = "";

  if (results.length) {
    html = '<div class="list-group">';
    for (var i = 0; i < Math.min(results.length, 5); i++) {
      var item = store[results[i].ref];
      var projectURL = item.url;

      html +=
        '<a href="' +
        projectURL +
        '" class="list-group-item list-group-item-action border-primary text-body">';
      html +=
        "<b>" +
        item.title +
        "</b><br><small>" +
        item.student +
        " (" +
        item.period +
        ")</small>";
      html += "</a>";
    }
    html += "</div>";
    resultsContainer.classList.add("dropdown-menu", "show");
  } else {
    resultsContainer.classList.remove("dropdown-menu", "show");
    resultsContainer.innerHTML = "";
  }
  resultsContainer.innerHTML = html;
}

// Lógica de busca rápida (apenas nos campos de alta prioridade: Título, Aluno, Período)
function quickSearch(query) {
  if (!idx) return;

  var results = idx.search(query + "*");

  var filteredResults = results.filter(function (result) {
    return result.score > 0.001;
  });

  displaySuggestions(filteredResults);
}

// Função de busca completa (usada apenas pelo busca.html)
function search(query, containerId) {
  if (!idx) {
    console.error("Lunr index not yet initialized.");
    return;
  }

  var searchTerms = query.trim().toLowerCase().split(/\s+/);
  var finalQuery = searchTerms.map((term) => term + "*").join(" ");

  var results = idx.search(finalQuery);
  displayResults(results, containerId);
}

// 3. LISTENERS
document.addEventListener("DOMContentLoaded", function () {
  loadIndex();

  // 1. Lógica do Autocomplete (Home Page)
  var contextSearchInput = document.getElementById("search-input-context");
  var quickResultsContainer = document.getElementById("quick-search-results");

  if (contextSearchInput) {
    contextSearchInput.addEventListener("keyup", function () {
      var query = this.value.trim();
      if (query.length >= MIN_CHARS_FOR_SEARCH) {
        quickSearch(query);
      } else {
        quickResultsContainer.classList.remove("dropdown-menu", "show");
        quickResultsContainer.innerHTML = "";
      }
    });

    document.addEventListener("click", function (e) {
      if (
        !contextSearchInput.contains(e.target) &&
        !quickResultsContainer.contains(e.target)
      ) {
        quickResultsContainer.classList.remove("dropdown-menu", "show");
        quickResultsContainer.innerHTML = "";
      }
    });
  }

  // 2. Lógica da página de busca completa (busca.html)
  var pageSearchInput = document.getElementById("search-input-page");
  if (pageSearchInput) {
    var urlParams = new URLSearchParams(window.location.search);
    var initialQuery = urlParams.get("q");

    if (initialQuery) {
      pageSearchInput.value = initialQuery;
      search(initialQuery, "search-results-container");
    }

    pageSearchInput.addEventListener("keyup", function () {
      search(this.value, "search-results-container");
    });
  }
});
