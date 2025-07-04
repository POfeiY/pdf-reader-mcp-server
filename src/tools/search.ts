import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import path from 'node:path'
import z from 'zod'
import { loadPDF, validatePDFPath } from '../common/utils'

export async function registerPdfSearchTool(server: McpServer): Promise<void> {
  server.tool(
    'search-pdf',
    'Text to search for in pdf',
    {
      file: z.string().describe('Path to the PDF file to search in'),
      query: z.string().describe('Text to search for'),
      case_sensitive: z.boolean().optional().describe('Case sensitive search. Default: false'),
      whole_word: z.boolean().optional().describe('Match whole words only. Default: false'),
    },
    async ({ file, query, case_sensitive = false, whole_word = false }) => {
      try {
        await validatePDFPath(file)
        const data = await loadPDF(file)

        let searchText = data.text
        let searchQuery = query

        if (!case_sensitive) {
          searchText = searchText.toLowerCase()
          searchQuery = searchQuery.toLowerCase()
        }

        const results: { line: number, content: string, matches: number }[] = []
        const lines = searchText.split('\n')

        lines.forEach((line: string, index: number) => {
          const searchLine = line
          if (whole_word) {
            const regex = new RegExp(`\\b${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, case_sensitive ? 'g' : 'gi')
            if (regex.test(line)) {
              results.push({
                line: index + 1,
                content: line.trim(),
                matches: (line.match(regex) || []).length,
              })
            }
          }
          else {
            if (searchLine.includes(searchQuery)) {
              results.push({
                line: index + 1,
                content: line.trim(),
                matches: (searchLine.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
              })
            }
          }
        })

        let response = `Search results for "${query}" in ${path.basename(file)}:\n`
        response += `Found ${results.length} matching lines with ${results.reduce((acc, cur) => acc + cur.matches, 0)} total matches\n\n`

        if (results.length > 0) {
          results.slice(0, 20).forEach((r) => {
            response += `Line ${r.line} (${r.matches} matches): ${r.content}\n`
          })

          if (results.length > 20) {
            response += `\n... and ${results.length - 20} more results`
          }
        }
        else {
          response += `No matches found.`
        }

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
              text: `Error searching PDF file: ${error.message}`,
            },
          ],
        }
      }
    },
  )
}
