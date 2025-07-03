import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import z from 'zod'
import { loadPDF, validatePDFPath } from '../common/utils'

export async function registerPdfMetadataTool(server: McpServer): Promise<void> {
  server.tool(
    'pdf-metadata',
    'Get PDF metadata only',
    {
      file: z.string().describe('Path to the PDF file to get metadata from'),
    },
    async ({ file }) => {
      try {
        await validatePDFPath(file)
        const data = await loadPDF(file)
        const stats = await stat(file)

        const metadata = {
          filename: path.basename(file),
          fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
          pages: data.numpages,
          author: data.info?.Author || 'Unknown',
          title: data.info?.Title || 'Unknown',
          subject: data.info?.Subject || 'Unknown',
          creator: data.info?.Creator || 'Unknown',
          producer: data.info?.Producer || 'Unknown',
          creationDate: data.info?.CreationDate || 'Unknown',
          modificationDate: data.info?.ModDate || 'Unknown',
          keywords: data.info?.Keywords || 'Unknown',
          encrypted: data.info?.IsEncrypted || false,
          version: data.version || 'Unknown',
        }

        let response = `PDF Metadata for: ${metadata.filename}\n\n`
        Object.entries(metadata).forEach(([key, value]) => {
          const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/[A-Z]/g, ' $1')
          response += `${displayKey}:${value}\n`
        })

        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
        }
      }
      catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error reading PDF metadata: ${error.message}`,
            },
          ],
        }
      }
    },
  )
}
