// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guidesSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'guides/QUICKSTART',
        'guides/USER_GUIDE',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'guides/DEPLOYMENT',
        'guides/PRODUCTION_READINESS',
        'guides/OPERATIONS',
        'guides/DEVELOPER_OPERATIONS',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'guides/CONTRIBUTING',
        'guides/FRONTEND',
        'guides/MOBILE',
        'guides/UI_CUSTOMIZATION',
        'guides/UI_ENHANCEMENT_IMPLEMENTATION',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'guides/SECURITY',
        'guides/SECURITY_CONFIGURATION',
        'guides/SECURITY_HARDENING',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'guides/FORUM_HOSTING_PLATFORM',
        'guides/CONVERSATION_UI_ENHANCEMENTS',
        'guides/SESSION_UPDATES',
      ],
    },
    {
      type: 'category',
      label: 'Maintenance',
      items: [
        'guides/BUGFIX_LOG',
        'guides/PRESENCE_FIX_2026_01_04',
      ],
    },
  ],
  
  apiSidebar: [
    'api/API',
    'api/API_REFERENCE',
    {
      type: 'link',
      label: 'OpenAPI Spec',
      href: '/api/openapi.yaml',
    },
  ],
  
  architectureSidebar: [
    {
      type: 'category',
      label: 'System Design',
      collapsed: false,
      items: [
        'architecture/ARCHITECTURE',
        'architecture/TECHNICAL_OVERVIEW',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      items: [
        'architecture/DATABASE',
        'architecture/DATABASE_SCALING',
      ],
    },
    {
      type: 'category',
      label: 'Real-time Systems',
      items: [
        'architecture/REALTIME_COMMUNICATION',
        'architecture/PRESENCE_ARCHITECTURE',
        'architecture/MATRIX',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      items: [
        'architecture/INFRASTRUCTURE_WARNING_CODES',
      ],
    },
  ],
  
  releaseNotesSidebar: [
    {
      type: 'category',
      label: 'Release Notes',
      collapsed: false,
      items: [
        'release-notes/V0.7.57_RELEASE_NOTES',
        'release-notes/V0.7.56_RELEASE_NOTES',
        'release-notes/V0.7.47_RELEASE_NOTES',
        'release-notes/V0.7.45_RELEASE_NOTES',
        'release-notes/V0.7.44_RELEASE_NOTES',
        'release-notes/V0.7.35_RELEASE_NOTES',
        'release-notes/V0.7.32_RELEASE_NOTES',
        'release-notes/V0.7.31_RELEASE_NOTES',
        'release-notes/V0.7.30_RELEASE_NOTES',
        'release-notes/V0.7.29_RELEASE_NOTES',
        'release-notes/V0.7.26_RELEASE_NOTES',
        'release-notes/V0.7.17_CRITICAL_FIXES',
        'release-notes/V0.7.17_PRODUCTION_READY',
      ],
    },
  ],
};

export default sidebars;
