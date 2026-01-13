// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CGraph Documentation',
  tagline: 'The All-in-One Open-Source Communication Platform',
  favicon: 'img/favicon.ico',

  // Production URL
  url: 'https://docs.cgraph.org',
  baseUrl: '/',

  // GitHub pages deployment config
  organizationName: 'cgraph-dev',
  projectName: 'CGraph',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'log',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Use CommonMark format to avoid MDX JSX parsing issues
  markdown: {
    format: 'detect',
    mermaid: false,
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          path: '../docs',
          routeBasePath: '/',
          editUrl: 'https://github.com/cgraph-dev/CGraph/tree/main/docs-website/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Social card
      image: 'img/cgraph-social-card.png',
      
      navbar: {
        title: 'CGraph',
        logo: {
          alt: 'CGraph Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'guidesSidebar',
            position: 'left',
            label: 'Guides',
          },
          {
            type: 'docSidebar',
            sidebarId: 'apiSidebar',
            position: 'left',
            label: 'API',
          },
          {
            type: 'docSidebar',
            sidebarId: 'architectureSidebar',
            position: 'left',
            label: 'Architecture',
          },
          {
            type: 'docSidebar',
            sidebarId: 'releaseNotesSidebar',
            position: 'left',
            label: 'Releases',
          },
          {
            href: 'https://github.com/cgraph-dev/CGraph',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/guides/QUICKSTART',
              },
              {
                label: 'API Reference',
                to: '/api/API_REFERENCE',
              },
              {
                label: 'Architecture',
                to: '/architecture/ARCHITECTURE',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/cgraph-dev/CGraph',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/cgraph',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/cgraphorg',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Website',
                href: 'https://www.cgraph.org',
              },
              {
                label: 'Contributing',
                to: '/guides/CONTRIBUTING',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} CGraph. Built with Docusaurus.`,
      },
      
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['elixir', 'bash', 'json', 'yaml', 'typescript'],
      },
      
      // Algolia search (configure with your Algolia credentials)
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'cgraph',
        contextualSearch: true,
        searchPagePath: 'search',
      },
      
      // Color mode
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      
      // Table of contents
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
    }),
};

export default config;
