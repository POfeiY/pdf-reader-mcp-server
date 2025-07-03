import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

import { loadPDF, validatePDFPath } from '../common/utils'

export function registerPdfReaderTool(server: McpServer): void {
  server.tool(
    'pdf-reader',
    'read pdf file content',
    {
      file: z.string().describe('Path to the PDF file to extract text from'),
      pages: z.string().optional().describe(`Page range (e.g., '1-5', '1,3,5', 'all'). Default: 'all'`),
      include_metadata: z.boolean().optional().describe('Include PDF metadata in output. Default: true'),
      clean_text: z.boolean().optional().describe('Clean and normalize extracted text. Default: false'),
    },
    async ({ file, include_metadata = true, clean_text = false }) => {
      try {
        await validatePDFPath(file)
        const data = await loadPDF(file)

        let extractedText = data.text

        if (clean_text) {
          extractedText = extractedText
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim()
        }

        const result = {
          filename: path.basename(file),
          fileSize: `${((await stat(file)).size / 1024).toFixed(2)} KB`,
          pages: data.numpages,
          text: extractedText,
          metadata: include_metadata
            ? {
                author: data.info?.Author || 'Unknown',
                title: data.info?.Title || 'Unknown',
                subject: data.info?.Subject || 'Unknown',
                creator: data.info?.Creator || 'Unknown',
                producer: data.info?.Producer || 'Unknown',
                creationDate: data.info?.CreationDate || 'Unknown',
                modificationDate: data.info?.ModDate || 'Unknown',
                keywords: data.info?.Keywords || 'Unknown',
              }
            : null,
        }

        let response = `Successfully extracted text from PDF: ${result.filename}`
        response += `File size: ${result.fileSize}\n`
        response += `Number of pages: ${result.pages}\n`

        if (include_metadata && result.metadata) {
          response += `\nMetadata:\n`
          Object.entries(result.metadata).forEach(([key, value]) => {
            response += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`
          })
        }

        response += `\nExtracted Text:\n${result.text}`

        return {
          content: [
            { type: 'text', text: response },
          ],
        }
      }
      catch (error: any) {
        return {
          content: [
            { type: 'text', text: `Error reading PDF file:${error.message}` },
          ],
        }
      }
    },

  )
}
