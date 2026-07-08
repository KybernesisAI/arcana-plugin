#!/usr/bin/env node

/**
 * Arcana MCP Proxy — stdio-to-HTTP bridge
 *
 * Bridges Claude Desktop/Code (stdio transport) to the remote
 * Arcana MCP server (Streamable HTTP transport).
 *
 * Credential resolution order (key and workspace independently):
 *   1. ARCANA_API_KEY / ARCANA_WORKSPACE environment variables
 *   2. KYBERNESIS_API_KEY / KYBERNESIS_WORKSPACE (legacy env names)
 *   3. ~/.arcana/api-key and ~/.arcana/workspace files
 *   4. ~/.kybernesis/api-key and ~/.kybernesis/workspace (legacy paths)
 *
 * If nothing is found, the proxy starts but returns auth errors,
 * prompting the user to run /arcana-setup.
 */

import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const MCP_SERVER_URL =
  process.env.ARCANA_MCP_URL || process.env.MCP_SERVER_URL || 'https://mcp.arcana.kybernesis.ai/mcp';

function fileValue(filePath) {
  if (existsSync(filePath)) {
    try {
      const v = readFileSync(filePath, 'utf-8').trim();
      if (v) return v;
    } catch {
      // fall through
    }
  }
  return null;
}

function resolveCred(envVars, filename) {
  for (const envVar of envVars) {
    if (process.env[envVar]) return process.env[envVar];
  }
  return (
    fileValue(join(homedir(), '.arcana', filename)) ??
    fileValue(join(homedir(), '.kybernesis', filename))
  );
}

const API_KEY = resolveCred(['ARCANA_API_KEY', 'KYBERNESIS_API_KEY'], 'api-key');
const WORKSPACE = resolveCred(['ARCANA_WORKSPACE', 'KYBERNESIS_WORKSPACE'], 'workspace');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let sessionId = null;

async function forwardMessage(message) {
  const isNotification = !('id' in message);

  if (!API_KEY || !WORKSPACE) {
    if (isNotification) return null;
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32603,
        message:
          'Arcana credentials not found. Run /arcana-setup to authenticate, ' +
          'or set ARCANA_API_KEY and ARCANA_WORKSPACE environment variables.',
      },
    };
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${API_KEY}`,
      'X-Kyberagent-Agent': WORKSPACE,
    };

    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
    });

    const newSessionId = response.headers.get('Mcp-Session-Id');
    if (newSessionId) {
      sessionId = newSessionId;
    }

    if (!response.ok) {
      const errorText = await response.text();
      if (isNotification) return null;
      process.stderr.write(`HTTP ${response.status}: ${errorText}\n`);

      if (response.status === 401) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message:
              'Arcana API key is invalid or expired. ' +
              'Get a new key at https://arcana.kybernesis.ai/settings/api-keys and run /arcana-setup.',
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: `Server error: HTTP ${response.status}`,
        },
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // Notifications get a 202 with an empty body — nothing to parse.
    if (isNotification || text.trim() === '') {
      return null;
    }

    // Handle SSE response format
    if (contentType.includes('text/event-stream') || text.includes('event:')) {
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          try {
            const jsonData = JSON.parse(trimmed.substring(5).trim());
            if (message.id !== undefined && jsonData.id === undefined) {
              jsonData.id = message.id;
            }
            return jsonData;
          } catch {
            // Continue to next data line
          }
        }
      }

      process.stderr.write(`No parseable data in SSE response: ${text.substring(0, 200)}\n`);
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32603, message: 'Invalid response format from server' },
      };
    }

    // Handle direct JSON response
    try {
      const jsonData = JSON.parse(text);
      if (message.id !== undefined && jsonData.id === undefined) {
        jsonData.id = message.id;
      }
      return jsonData;
    } catch {
      process.stderr.write(`Failed to parse response: ${text.substring(0, 200)}\n`);
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32603, message: 'Invalid response format from server' },
      };
    }
  } catch (error) {
    if (isNotification) return null;
    process.stderr.write(`Error forwarding message: ${error.message}\n`);
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: { code: -32603, message: error.message },
    };
  }
}

rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);

    // Notifications (no id) don't expect responses
    if (!('id' in message)) {
      await forwardMessage(message);
      return;
    }

    const response = await forwardMessage(message);
    if (response) console.log(JSON.stringify(response));
  } catch (error) {
    process.stderr.write(`Error processing line: ${error.message}\n`);
  }
});

rl.on('close', () => {
  process.exit(0);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

process.stderr.write(`Arcana MCP proxy started | server=${MCP_SERVER_URL} | auth=${API_KEY ? 'yes' : 'MISSING'}\n`);
