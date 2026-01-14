# Context7 MCP Helper

Purpose: auxiliary research and drafting assistant available via the MCP endpoint defined in `.vscode/mcp.json`. It is not a runtime dependency.

## Setup
- Use an MCP-capable client (e.g., VS Code with MCP support).
- When prompted, provide your `CONTEXT7_API_KEY`. It is stored locally by the client, not in the repo or CI.
- The MCP endpoint is `https://mcp.context7.com/mcp`; the header `CONTEXT7_API_KEY` is injected from your prompt input.

## Good Uses
- Summarize long files or PR diffs.
- Draft changelog/release note text and documentation snippets.
- Suggest test cases, threat-model checklists, or scan allowlists (e.g., gitleaks patterns).
- Outline refactors or reading plans for unfamiliar modules.

## Safety
- Do not paste regulated or highly sensitive data.
- Review and edit any generated text or code before committing.
- Do not add the key to version control or CI secrets unless intentionally needed.
