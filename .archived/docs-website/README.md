# CGraph Documentation Website

This is the documentation website for CGraph, built with [Docusaurus](https://docusaurus.io/).

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

## Installation

```bash
cd docs-website
pnpm install
```

## Local Development

```bash
pnpm start
```

This starts a local development server at `http://localhost:3000` with hot reloading.

## Build

```bash
pnpm build
```

This generates static content in the `build` directory.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `docs-website`
3. Build command: `pnpm build`
4. Output directory: `build`

### Netlify

1. Connect your GitHub repository to Netlify
2. Set the base directory to `docs-website`
3. Build command: `pnpm build`
4. Publish directory: `docs-website/build`

### GitHub Pages

```bash
GIT_USER=<username> pnpm deploy
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY docs-website/package.json docs-website/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY docs-website ./docs-website
COPY docs ./docs
RUN cd docs-website && pnpm build

FROM nginx:alpine
COPY --from=builder /app/docs-website/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Configuration

### Algolia Search

To enable search, update `docusaurus.config.js` with your Algolia credentials:

```js
algolia: {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_SEARCH_API_KEY',
  indexName: 'cgraph',
},
```

Apply for DocSearch at [docsearch.algolia.com](https://docsearch.algolia.com/apply/).

### Custom Domain

Update `docusaurus.config.js`:

```js
url: 'https://docs.yourdomain.com',
```

## Documentation Structure

```
docs/
├── guides/          # User and developer guides
├── api/             # API documentation
├── architecture/    # System architecture
└── release-notes/   # Version history
```

## Writing Documentation

- Use Markdown or MDX
- Place images in `docs-website/static/img/`
- Use front matter for metadata:

```yaml
---
title: Page Title
sidebar_label: Short Label
description: SEO description
---
```

## Support

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [CGraph GitHub Issues](https://github.com/cgraph-dev/CGraph/issues)
