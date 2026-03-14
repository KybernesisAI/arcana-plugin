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

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://api.kybernesis.ai/mcp';
const API_KEY_FILE = join(homedir(), '.kybernesis', 'api-key');

function resolveApiKey() {
  // 1. Environment variable
  if (process.env.KYBERNESIS_API_KEY) {
    return process.env.KYBERNESIS_API_KEY;
  }

  // 2. File-based key
  if (existsSync(API_KEY_FILE)) {
    try {
      const key = readFileSync(API_KEY_FILE, 'utf-8').trim();
      if (key) return key;
    } catch {
      // Fall through
    }
  }

  return null;
}

const API_KEY = resolveApiKey();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let sessionId = null;

async function forwardMessage(message) {
  if (!API_KEY) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32603,
        message:
          'Kybernesis API key not found. Run /kybernesis-setup to authenticate, ' +
          'or set the KYBERNESIS_API_KEY environment variable.',
      },
    };
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${API_KEY}`,
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
              'Kybernesis API key is invalid or expired. ' +
              'Get a new key at https://kybernesis.ai/settings and run /kybernesis-setup.',
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
