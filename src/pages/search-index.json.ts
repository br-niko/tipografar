import type { APIRoute } from 'astro';
import {
  getAllProjects,
  getProjectSlug,
   getTaxonomies,
  resolveCoverImage,
  slugify,
} from '../lib/projects';

function normalize(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const GET: APIRoute = async () => {
  const allProjects = await getAllProjects();
  const { categories, tags, semesters } = await getTaxonomies();

  const projects = allProjects.map((p) => {
    const firstCat = p.data.categories[0] ?? '';
    const rawBody = p.body ?? '';
    const combinedSearchText = normalize(
      [
        p.data.title,
        p.data.aluno,
        p.data.semestre,
        p.data.premio,
        p.data.categories.join(' '),
        p.data.tags.join(' '),
        rawBody,
      ].join(' ')
    );

    return {
      title: p.data.title,
      aluno: p.data.aluno,
      url: `/projetos/${getProjectSlug(p)}`,
      category: firstCat,
      categoryUrl: firstCat ? `/categorias/${slugify(firstCat)}` : '',
      semestre: p.data.semestre,
      premio: p.data.premio ?? '',
      tags: p.data.tags,
      imagemCapa: resolveCoverImage(p.data.imagem_capa),
      searchText: combinedSearchText,
    };
  });

  const awardedCount = allProjects.filter(
    (p) => p.data.premio && p.data.premio.trim() !== ''
  ).length;

  const taxonomies = [
    ...categories.map((c) => ({
      name: c.name,
      type: 'Categoria',
      url: `/categorias/${c.slug}`,
      count: c.count,
      searchText: normalize(`${c.name} categoria`),
    })),
    ...tags.map((t) => ({
      name: t.name,
      type: 'Tag',
      url: `/tags/${t.slug}`,
      count: t.count,
      searchText: normalize(`${t.name} tag`),
    })),
    ...semesters.map((s) => ({
      name: s.name,
      type: 'Semestre',
      url: `/semestres/${s.slug}`,
      count: s.count,
      searchText: normalize(`${s.name} ${s.slug} semestre`),
    })),
    {
      name: 'Premiados',
      type: 'Arquivo',
      url: '/premiados',
      count: awardedCount,
      searchText: normalize('premiados premio bienal trofeu'),
    },
  ];

  return new Response(JSON.stringify({ projects, taxonomies }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
