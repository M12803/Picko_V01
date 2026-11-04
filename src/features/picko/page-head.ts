export function pickoHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | Picko` },
      { name: 'description', content: description },
      { property: 'og:title', content: `${title} | Picko` },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }
}