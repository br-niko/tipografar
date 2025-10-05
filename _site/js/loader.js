document.addEventListener("DOMContentLoaded", () => {
  const loaderContainer = document.getElementById("random-featured-project");
  if (!loaderContainer) return;

  fetch("/featured_projects.json")
    .then((response) => response.json())
    .then((projects) => {
      if (projects.length === 0) {
        loaderContainer.style.display = "none";
        return;
      }

      const randomProject =
        projects[Math.floor(Math.random() * projects.length)];

      // Novo HTML com classes para a sobreposição
      const projectHTML = `
        <div class="col-lg-6">
          <h1 class="main-feature-title">
            <a href="${randomProject.url}" class="text-dark text-decoration-none">${randomProject.title}</a>
          </h1>
        </div>
        <div class="col-lg-6">
          <a href="${randomProject.url}" class="main-feature-image-wrapper d-block">
            <div class="main-feature-image" style="height: 300px; background-color: #ddd;">
              </div>
            <p class="main-feature-author mt-2">${randomProject.aluno}</p>
          </a>
        </div>
      `;

      setTimeout(() => {
        loaderContainer.innerHTML = projectHTML;
        loaderContainer.classList.remove("loading");
      }, 500);
    })
    .catch((error) => {
      console.error("Erro ao carregar projetos em destaque:", error);
      loaderContainer.style.display = "none";
    });
});
