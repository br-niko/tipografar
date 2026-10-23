import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projetos = defineCollection({
  // Lê diretamente os arquivos Markdown da pasta _posts do repositório
  loader: glob({ pattern: '**/*.md', base: '../_posts' }),
  schema: z.object({
    title: z.string(),
    layout: z.string().optional(),
    aluno: z.string(),
    semestre: z.string(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    premio: z.string().optional().default(''),
    featured: z.boolean().default(false),
    imagem_capa: z.string().optional().default('/assets/images/placeholder.svg'),
  }),
});

export const collections = { projetos };
