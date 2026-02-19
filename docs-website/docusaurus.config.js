// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CGraph Documentation',
  tagline: 'The All-in-One Communication Platform',
  favicon: 'img/favicon.svg',

  // Production URL
  url: 'https://docs.cgraph.org',
  baseUrl: '/',

  // GitHub pages deployment config
  organizationName: 'cgraph-dev',
  projectName: 'CGraph',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Use CommonMark format to avoid MDX JSX parsing issues
  markdown: {
    format: 'detect',
    mermaid: false,
  },

  plugins: [
    // OpenAPI plugin for REST API docs
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'openapi',
        docsPluginId: 'classic',
        config: {
          cgraph: {
            specPath: '../docs/api/openapi.yaml',
            outputDir: 'docs/rest-api',
            sidebarOptions: {
              groupPathsBy: 'tag',
              categoryLinkSource: 'tag',
            },
          },
        },
      },
    ],
  ],

  themes: ['docusaurus-theme-openapi-docs'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          path: '../docs',
          routeBasePath: '/docs',
          editUrl: 'https://github.com/cgraph-dev/CGraph/tree/main/docs-website/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          // Enable versioning
          lastVersion: 'current',
          versions: {
            current: {
              label: '0.9.31',
              path: '',
            },
          },
          // Include all docs
          includeCurrentVersion: true,
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'CGraph Blog',
          blogDescription: 'Engineering updates from the CGraph team',
          postsPerPage: 10,
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 'ALL',
        },
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
          srcDark: 'img/logo-dark.svg',
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
            to: '/blog',
            label: 'Blog',
            position: 'left',
          },
          {
            type: 'docSidebar',
            sidebarId: 'legalSidebar',
            position: 'left',
            label: 'Legal',
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
                to: '/docs/guides/QUICKSTART',
              },
              {
                label: 'API Reference',
                to: '/docs/api/API_REFERENCE',
              },
              {
                label: 'Architecture',
                to: '/docs/architecture/ARCHITECTURE',
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
              href: 'https://github.com/cgraph-dev/CGraph/blob/main/CONTRIBUTING.md',
              },
            ],
          },
          {
            title: 'Legal',
            items: [
              {
                label: 'Privacy Policy',
                to: '/docs/LEGAL/PRIVACY_POLICY',
              },
              {
                label: 'Terms of Service',
                to: '/docs/LEGAL/TERMS_OF_SERVICE',
              },
              {
                label: 'Cookie Policy',
                to: '/docs/LEGAL/COOKIE_POLICY',
              },
              {
                label: 'GDPR',
                to: '/docs/LEGAL/GDPR',
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

      // Algolia search — disabled until real credentials are configured
      // To enable: set ALGOLIA_APP_ID and ALGOLIA_API_KEY environment variables
      // and uncomment the algolia block below
      // algolia: {
      //   appId: process.env.ALGOLIA_APP_ID,
      //   apiKey: process.env.ALGOLIA_API_KEY,
      //   indexName: 'cgraph',
      //   contextualSearch: true,
      //   searchPagePath: 'search',
      // },

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
