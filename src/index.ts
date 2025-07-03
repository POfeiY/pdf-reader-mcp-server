import process from 'node:process'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { registerPdfReaderTool } from './tools/read'

const server = new McpServer({
  name: 'pdf-reader-mcp-server',
  version: '1.0.1',
})

async function main(): Promise<void> {
  registerPdfReaderTool(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((e) => {
  console.error(`error in main`, e)
  process.exit(1)
})
