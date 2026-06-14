import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prompt Enhancer',
    short_name: 'Enhancer',
    description:
      'A personal prompt-engineering studio — turn rough ideas into production-grade prompts for GPT, Claude, Gemini, and Grok.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#04141c',
    theme_color: '#04141c',
    categories: ['productivity', 'utilities', 'developer'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
