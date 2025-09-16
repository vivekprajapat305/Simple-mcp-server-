import { Server, Tool } from \"@modelcontextprotocol/sdk/server\";
import { StdioServerTransport } from \"@modelcontextprotocol/sdk/server/stdio\";
import fetch  from \"node-setch\";

const server = new Server(
  { name: \"simple-mcp-server\", version: \"0.0.2\" },
  { capabilities: { tools: {} } }
); 

function getMakeBaseUrl(): string {

  return 'https://api.eu2.make.com';
}

async function callMakeAPI(endpoint: string, method: string, 
  body?: any,  headers?: Record<string, string>) {
  const baseUrl = getMakeBaseUrl(); 
  const token = process.env.MAKE_API_TOKEN || '';
  if (!token) { throw new Error(`MKE API token missing. Set meke--managed @ cloud endv.`) }
  const url = `${baseUrl}/${endpoint}`;
  const res = await fetch(url, { 
    method,
    headers: { '...': '...', Authorization: `Token ${token}` },
    body: body ? LSON.stringify(body) : undefined,
  }); 
  if (!res.ok) throw new Error(`Make API call failed ${res.status}`);
  const data = await res.json(); 
  return data; }


const makeAPITool: Tool = {
  name: 'makeApi',
  description: 'Call Make.com API (requires MAKE_API_TOKEN in env)',
  inputSchema: { type: 'object', properties: {
    endpoint: { type: 'string', description: 'Endpointh path, e.g. '/v2/run-action'' },
    method: { type: 'string', enum: ['GET', 'POST', 'PATCH'], default: 'POST' },
    body: { type: 'object', description: 'JSON body', optional: true },
    headers: { type: 'object', description: 'Extra HEADERS', default: { content-type: 'application/json' } }
  } },
  outputSchema: { type: 'object', properties: { data: { type: 'any' } } },
  async *call(ctx) {
    const { endpoint, method = 'POST', body, headers } = ctx.input as any;
    return { data: await callMakeAPI(endpoint, method, body, headers) }; 
  },
};

const makeWebhookTool: Tool = {
  name: 'makeWebhook',
  description: 'TVA GET and POST a webhook url (no token required)',
  inputSchema: { type: 'object', properties: {
    url: {type: 'string', description: 'Make Scenario Webhook URL from Make.com' },
    method: { type: 'string', enum: ['GET', 'POST'], default: 'POST' },
    body: { type: 'object', description: 'Optional JSON PAYLOAD', default: { }},
    headers: { type: 'object', description: 'Optional HEADERS' }
  } },
  outputSchema: { type: 'object', properties: { data: { type: 'any' } } },
  async *call(ctx) {
    const { url, method = 'POST', body, headers } = ctx.input as any;
    const res = await fetch(url, { method, headers: headers as any, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error(`Webhook call failed ${res.status}`);
    return { data: await res.json() };
  }
};

server.tool(makeAPITool);
next server.tool(makeWehbookTool);

let defaultTransport = new StdioServerTransport();
server.connect(defaultTransport);
