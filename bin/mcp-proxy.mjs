#!/usr/bin/env node

/**
 * Kybernesis MCP Proxy — stdio-to-HTTP bridge
 *
 * Bridges Claude Desktop/Code (stdio transport) to the remote
 * Kybernesis MCP server (Streamable HTTP transport).
 *
 * API key resolution order:
 *   1. KYBERNESIS_API_KEY environment variable
 *   2. ~/.kybernesis/api-key file
 *
 * If neither is found, the proxy starts but returns auth errors,
 * prompting the user to run /kybernesis-setup.
 */

import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp.arcana.kybernesis.ai/mcp';
const API_KEY_FILE = join(homedir(), '.kybernesis', 'api-key');
const WORKSPACE_FILE = join(homedir(), '.kybernesis', 'workspace');

function resolveFromEnvOrFile(envVar, filePath) {
  if (process.env[envVar]) return process.env[envVar];
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

const API_KEY = resolveFromEnvOrFile('KYBERNESIS_API_KEY', API_KEY_FILE);
const WORKSPACE = resolveFromEnvOrFile('KYBERNESIS_WORKSPACE', WORKSPACE_FILE);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let sessionId = null;

async function forwardMessage(message) {
  if (!API_KEY || !WORKSPACE) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32603,
        message:
          'Arcana credentials not found. Run /kybernesis-setup to authenticate, ' +
          'or set KYBERNESIS_API_KEY and KYBERNESIS_WORKSPACE environment variables.',
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
      process.stderr.write(`HTTP ${response.status}: ${errorText}\n`);

      if (response.status === 401) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message:
              'Arcana API key is invalid or expired. ' +
              'Get a new key at https://arcana.kybernesis.ai/settings/api-keys and run /kybernesis-setup.',
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
    console.log(JSON.stringify(response));
  } catch (error) {
    process.stderr.write(`Error processing line: ${error.message}\n`);
  }
});

rl.on('close', () => {
  process.exit(0);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

process.stderr.write(`Kybernesis MCP proxy started | server=${MCP_SERVER_URL} | auth=${API_KEY ? 'yes' : 'MISSING'}\n`);
