import { getCollection, type CollectionEntry } from 'astro:content';

export type ProjetoEntry = CollectionEntry<'projetos'>;

/**
 * Converte texto em slug amigável para URL (sem acentos, minúsculo e com hífens).
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Gera o slug do projeto removendo o prefixo de data YYYY-MM-DD- dos arquivos do Jekyll
 * e acrescentando o semestre caso o nome base seja genérico ("projeto-lettering").
 */
export function getProjectSlug(entry: ProjetoEntry): string {
  const withoutDate = entry.id.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  const baseSlug = slugify(withoutDate);
  if (baseSlug === 'projeto-lettering') {
    return `${baseSlug}-${slugify(entry.data.semestre)}`;
  }
  return baseSlug;
}

/**
 * Normaliza o caminho da imagem de capa (tratando placeholders antigos que não existem no disco).
 */
export function resolveCoverImage(imagemCapa?: string): string {
  if (!imagemCapa || imagemCapa.includes('placeholder.jpg')) {
    return '/assets/images/placeholder.svg';
  }
  return imagemCapa;
}

/**
 * Retorna todos os projetos ordenados por semestre (mais recente primeiro) e título.
 */
export async function getAllProjects(): Promise<ProjetoEntry[]> {
  const entries = await getCollection('projetos');
  return entries.sort((a, b) => {
    const semCmp = b.data.semestre.localeCompare(a.data.semestre);
    if (semCmp !== 0) return semCmp;
    return a.data.title.localeCompare(b.data.title, 'pt-BR');
  });
}

export interface TaxonomyItem {
  name: string;
  slug: string;
  count: number;
  fontSizeRem?: number;
}

/**
 * Extrai categorias únicas, semestres únicos e calcula automaticamente a Nuvem de Tags
 * com escala proporcional (min/max) baseada na frequência de uso.
 */
export async function getTaxonomies() {
  const projects = await getAllProjects();

  const categoryMap = new Map<string, TaxonomyItem>();
  const semesterMap = new Map<string, TaxonomyItem>();
  const tagMap = new Map<string, TaxonomyItem>();

  for (const proj of projects) {
    // Categorias
    for (const cat of proj.data.categories) {
      const clean = cat.trim();
      if (!clean) continue;
      const slug = slugify(clean);
      const existing = categoryMap.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        categoryMap.set(slug, { name: clean, slug, count: 1 });
      }
    }

    // Semestres (ex: "2024/1" -> slug "2024-1")
    const sem = proj.data.semestre.trim();
    if (sem) {
      const slug = sem.replace('/', '-');
      const existing = semesterMap.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        semesterMap.set(slug, { name: sem, slug, count: 1 });
      }
    }

    // Tags
    for (const tag of proj.data.tags) {
      const clean = tag.trim();
      if (!clean || clean.toLowerCase() === 'premiados') continue;
      const slug = slugify(clean);
      const existing = tagMap.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        tagMap.set(slug, { name: clean, slug, count: 1 });
      }
    }
  }

  const categories = Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  );

  const semesters = Array.from(semesterMap.values()).sort((a, b) =>
    b.name.localeCompare(a.name, 'pt-BR')
  );

  // Cálculo automático da Nuvem de Palavras (escala entre 0.95rem e 1.85rem)
  const rawTags = Array.from(tagMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  );
  const counts = rawTags.map((t) => t.count);
  const minCount = counts.length ? Math.min(...counts) : 1;
  const maxCount = counts.length ? Math.max(...counts) : 1;
  const minRem = 0.95;
  const maxRem = 1.85;

  const tags: TaxonomyItem[] = rawTags.map((t) => {
    const ratio = maxCount === minCount ? 0.5 : (t.count - minCount) / (maxCount - minCount);
    const fontSizeRem = Number((minRem + ratio * (maxRem - minRem)).toFixed(2));
    return { ...t, fontSizeRem };
  });

  return {
    categories,
    semesters,
    tags,
    latestSemester: semesters[0]?.name ?? null,
  };
}
