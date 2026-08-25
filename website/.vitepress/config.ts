import { defineConfig } from "vitepress";

const base = process.env.PAGES ? "/pilotbook/" : "/";

export default defineConfig({
  srcDir: "../guide",
  srcExclude: ["README.md"],
  title: "Pilotbook",
  description:
    "Repo-native project management for AI agents. Calibrated skills and an authority-ordered brief from a lint-gated markdown graph.",
  base,
  lastUpdated: true,
  ignoreDeadLinks: [
    (url) =>
      url.includes("..") ||
      url.includes("/docs/") ||
      /AGENTS|SECURITY|CONTRIBUTING|CHANGELOG|CODE_OF_CONDUCT|LICENSE/.test(url),
  ],
  themeConfig: {
    siteTitle: "Pilotbook",
    nav: [
      { text: "Get started", link: "/getting-started" },
      { text: "CLI", link: "/cli" },
      { text: "API", link: "/api" },
      { text: "GitHub", link: "https://github.com/SailerAI/pilotbook" },
    ],
    sidebar: [
      {
        text: "Start",
        items: [
          { text: "Getting started", link: "/getting-started" },
          { text: "Concepts", link: "/concepts" },
          { text: "Explore", link: "/explore" },
          { text: "Ship", link: "/ship" },
        ],
      },
      {
        text: "How-to",
        items: [
          { text: "Set up Notion", link: "/notion" },
          { text: "Sync with Notion", link: "/notion-sync" },
        ],
      },
      {
        text: "The graph",
        items: [
          { text: "Items and frontmatter", link: "/items" },
          { text: "Graph and BOARD.md", link: "/graph" },
          { text: "The brief", link: "/brief" },
          { text: "Lint", link: "/lint" },
          { text: "Verify, analyze, converge", link: "/verify" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "CLI", link: "/cli" },
          { text: "Agents, skills, and MCP", link: "/agents" },
          { text: "UI", link: "/ui" },
          { text: "Config", link: "/config" },
          { text: "Interop", link: "/interop" },
          { text: "CI", link: "/ci" },
          { text: "Library, MCP, and REST", link: "/api" },
          { text: "Comparison", link: "/comparison" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/SailerAI/pilotbook" },
      { icon: "npm", link: "https://www.npmjs.com/package/pilotbook" },
    ],
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/SailerAI/pilotbook/edit/main/guide/:path",
      text: "Edit this page",
    },
    outline: { level: [2, 3] },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Your repo has the chart. Pilotbook has the directions.",
    },
  },
});
