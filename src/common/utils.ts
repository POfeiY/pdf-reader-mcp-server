import { access, readFile, stat } from 'node:fs/promises'
import pdfParse from 'pdf-parse'

export async function validatePDFPath(filepath: string): Promise<void> {
  try {
    await access(filepath)
  }
  catch {
    throw new Error(`File not found: ${filepath}`)
  }
  if (!filepath.toLocaleLowerCase().endsWith('.pdf'))
    throw new Error(`File must be have .pdf extension: ${filepath}`)
}

export async function loadPDF(filepath: string): Promise<any> {
  try {
    const stats = await stat(filepath)

    if (stats.size > 10 * 1024 * 1024)
      throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`)

    const dataBuffer = await readFile(filepath)

    // Suppress console output during PDF parsing to avoid JSON protocol interference
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    }

    // Temporarily suppress console output
    console.log = () => {}
    console.warn = () => {}
    console.error = () => {}
    console.info = () => {}

    try {
      return await pdfParse(dataBuffer)
    }
    finally {
      // recover
      console.log = originalConsole.log
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.info = originalConsole.info
    }
  }
  catch (error: any) {
    throw new Error(`Failed to load PDF: ${error.message}`)
  }
}
