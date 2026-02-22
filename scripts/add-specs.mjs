#!/usr/bin/env node
/**
 * Add @spec annotations to Elixir functions that lack them.
 * Reads function signatures and adds appropriate @spec lines.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const ROOT = 'apps/backend';

// Type inference rules for common patterns
const SPEC_RULES = {
  // Phoenix controller actions: def action(conn, params)
  controller: {
    pattern: /^\s+def (\w+)\(%?Plug\.Conn\{?\}?\s*=?\s*conn,\s*(%\{.*?\}|params|_params|attrs|_)\)/,
    spec: (name) => `@spec ${name}(Plug.Conn.t(), map()) :: Plug.Conn.t()`,
  },
  // Fallback controller: def call(conn, {:error, ...})
  fallback: {
    pattern: /^\s+def call\(conn,/,
    spec: () => `@spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()`,
  },
  // Channel handlers: def handle_in("event", payload, socket)
  handleIn: {
    pattern: /^\s+def handle_in\(/,
    spec: () => `@spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}`,
  },
  // Channel join: def join(topic, params, socket)
  join: {
    pattern: /^\s+def join\(/,
    spec: () => `@spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}`,
  },
  // Channel handle_info
  handleInfo: {
    pattern: /^\s+def handle_info\(/,
    spec: () => `@spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}`,
  },
  // JSON render: def render(template, assigns)
  render: {
    pattern: /^\s+def render\(/,
    spec: () => `@spec render(String.t(), map()) :: map()`,
  },
};

// Files to process with their type
const FILES = [
  // Fallback controller — one spec covers all call/2 clauses
  { file: 'lib/cgraph_web/controllers/fallback_controller.ex', type: 'fallback', oncePerName: true },
  // Channels
  { file: 'lib/cgraph_web/channels/events_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/gamification_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/call_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/marketplace_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/user_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/presence_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/conversation_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/thread_channel.ex', type: 'channel' },
  { file: 'lib/cgraph_web/channels/forum_channel.ex', type: 'channel' },
  // Controllers
  { file: 'lib/cgraph_web/controllers/api/v1/friend_controller.ex', type: 'controller' },
  { file: 'lib/cgraph_web/controllers/admin/events_controller.ex', type: 'controller' },
  { file: 'lib/cgraph_web/controllers/friend_controller.ex', type: 'controller' },
  // JSON views
  { file: 'lib/cgraph_web/controllers/error_json.ex', type: 'json' },
  { file: 'lib/cgraph_web/controllers/api/v1/friend_json.ex', type: 'json' },
  { file: 'lib/cgraph_web/controllers/api/v1/forum_json.ex', type: 'json' },
  // Utility modules
  { file: 'lib/cgraph_web/api/input_validation/type_coercion.ex', type: 'utility' },
  { file: 'lib/cgraph_web/helpers/param_parser.ex', type: 'utility' },
  { file: 'lib/cgraph_web/error_tracker/extractor.ex', type: 'utility' },
  { file: 'lib/cgraph_web/validation/validation.ex', type: 'utility' },
  { file: 'lib/cgraph_web/telemetry/handlers.ex', type: 'utility' },
  { file: 'lib/cgraph_web/api/input_validation/constraints.ex', type: 'utility' },
  { file: 'lib/cgraph_web/api/input_validation/sanitization.ex', type: 'utility' },
  { file: 'lib/cgraph/mailer/templates.ex', type: 'utility' },
  { file: 'lib/cgraph/jobs/server.ex', type: 'genserver' },
];

let totalAdded = 0;

for (const { file, type, oncePerName } of FILES) {
  const fullPath = `${ROOT}/${file}`;
  let content;
  try {
    content = readFileSync(fullPath, 'utf-8');
  } catch {
    console.log(`  Skip (not found): ${file}`);
    continue;
  }

  const lines = content.split('\n');
  const newLines = [];
  let added = 0;
  const specsSeen = new Set();

  // First pass: collect existing @spec names
  for (const line of lines) {
    const specMatch = line.match(/^\s*@spec\s+(\w+)/);
    if (specMatch) specsSeen.add(specMatch[1]);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';

    // Check if this line is a `def` (not `defp`)
    const defMatch = line.match(/^\s+def (\w+)\(/);
    if (!defMatch) {
      newLines.push(line);
      continue;
    }

    const fnName = defMatch[1];

    // Skip if already has @spec on previous line
    if (prevLine.trim().startsWith('@spec')) {
      newLines.push(line);
      continue;
    }

    // Skip if @spec already exists for this function name
    if (specsSeen.has(fnName)) {
      newLines.push(line);
      continue;
    }

    // Determine the spec to add
    let spec = null;
    const indent = line.match(/^(\s*)/)[1];

    if (type === 'fallback' && fnName === 'call') {
      spec = `${indent}@spec call(Plug.Conn.t(), term()) :: Plug.Conn.t()`;
    } else if (type === 'channel') {
      if (fnName === 'handle_in') {
        spec = `${indent}@spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}`;
      } else if (fnName === 'join') {
        spec = `${indent}@spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}`;
      } else if (fnName === 'handle_info') {
        spec = `${indent}@spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}`;
      } else if (fnName === 'terminate') {
        spec = `${indent}@spec terminate(term(), Phoenix.Socket.t()) :: :ok`;
      }
    } else if (type === 'controller') {
      // Controller action: def action(conn, params)
      if (line.match(/def \w+\(.*conn/i)) {
        spec = `${indent}@spec ${fnName}(Plug.Conn.t(), map()) :: Plug.Conn.t()`;
      }
    } else if (type === 'json') {
      if (fnName === 'render') {
        spec = `${indent}@spec render(String.t(), map()) :: map()`;
      } else {
        // Helper functions in JSON modules return maps
        spec = `${indent}@spec ${fnName}(map()) :: map()`;
      }
    } else if (type === 'genserver') {
      if (fnName === 'init') {
        spec = `${indent}@spec init(term()) :: {:ok, map()}`;
      } else if (fnName === 'handle_call') {
        spec = `${indent}@spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}`;
      } else if (fnName === 'handle_cast') {
        spec = `${indent}@spec handle_cast(term(), map()) :: {:noreply, map()}`;
      } else if (fnName === 'handle_info') {
        spec = `${indent}@spec handle_info(term(), map()) :: {:noreply, map()}`;
      } else if (fnName === 'start_link') {
        spec = `${indent}@spec start_link(keyword()) :: GenServer.on_start()`;
      }
    } else if (type === 'utility') {
      // For utility functions, add generic specs based on function name patterns
      if (fnName.startsWith('validate') || fnName.startsWith('check')) {
        spec = `${indent}@spec ${fnName}(term()) :: {:ok, term()} | {:error, String.t()}`;
      } else if (fnName.startsWith('parse') || fnName.startsWith('extract')) {
        spec = `${indent}@spec ${fnName}(term()) :: term()`;
      } else if (fnName.startsWith('coerce') || fnName.startsWith('cast')) {
        spec = `${indent}@spec ${fnName}(term()) :: {:ok, term()} | {:error, String.t()}`;
      } else if (fnName.startsWith('sanitize') || fnName.startsWith('clean')) {
        spec = `${indent}@spec ${fnName}(term()) :: term()`;
      } else if (fnName.startsWith('send_') || fnName.startsWith('deliver')) {
        spec = `${indent}@spec ${fnName}(map()) :: {:ok, term()} | {:error, term()}`;
      } else if (fnName.startsWith('handle')) {
        spec = `${indent}@spec ${fnName}(term(), term()) :: :ok`;
      } else if (fnName.startsWith('format') || fnName.startsWith('build') || fnName.startsWith('render')) {
        spec = `${indent}@spec ${fnName}(term()) :: String.t()`;
      }
    }

    if (spec && !specsSeen.has(fnName)) {
      newLines.push(spec);
      specsSeen.add(fnName);
      added++;
    }

    newLines.push(line);
  }

  if (added > 0) {
    writeFileSync(fullPath, newLines.join('\n'), 'utf-8');
    console.log(`  +${added} specs: ${file}`);
    totalAdded += added;
  }
}

console.log(`\n✅ Added ${totalAdded} @spec annotations total.`);
