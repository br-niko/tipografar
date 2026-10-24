import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const stringOrArray = z
  .union([z.array(z.string()), z.string().transform((val) => (val ? [val] : []))])
  .default([]);

const projetos = defineCollection({
  // Lê diretamente os arquivos Markdown da pasta _posts do repositório
  loader: glob({ pattern: '**/*.md', base: './_posts' }),
  schema: z.object({
    title: z.string(),
    layout: z.string().optional(),
    aluno: z.string(),
    semestre: z.string(),
    categories: stringOrArray,
    tags: stringOrArray,
    premio: z.string().nullable().optional().transform((v) => v ?? ''),
    featured: z.boolean().nullable().optional().transform((v) => Boolean(v)),
    imagem_capa: z
      .string()
      .nullable()
      .optional()
      .transform((v) => v || '/assets/images/placeholder.svg'),
  }),
});

export const collections = { projetos };
