#!/usr/bin/env -S deno run --allow-read --allow-write
import { expandGlob } from "jsr:@std/fs/expand-glob"

/**
 * Deno script to add `.ts` extension to relative imports in TypeScript files.
 * (Written by AI! But also expanded to improve the regex and support globbing)
 *
 * Usage:
 * deno run --allow-read --allow-write add_ts_extension.ts <file1.ts> [file2.ts ...]
 *
 * This script reads the specified TypeScript files, finds import/export statements
 * referencing relative paths (starting with './' or '../') that do not already
 * end with '.ts', appends the '.ts' extension to those paths, and saves
 * the modified content back to the original files.
 */

// Regular expression to find relative import/export paths without .ts extension.
// Explanation:
// - `(from\s+)`: Matches and captures "from" followed by one or more spaces.
// - `(['"])`: Matches and captures the opening quote (' or ").
// - `(\.\.?\/[^'"]+?)`: Matches and captures the relative path:
//   - `\.`: Matches a literal dot.
//   - `\.?`: Optionally matches a second dot (for '../').
//   - `\/`: Matches the slash.
//   - `[^'"]+?`: Matches one or more characters that are not quotes (non-greedy).
// - `(?<!\.ts)`: Negative lookbehind assertion. Ensures the captured path does NOT end with ".ts".
// - `\2`: Matches the closing quote (same as the captured opening quote).
// - `g`: Global flag, to find all matches in the string.
const importRegex =
  /((?:im|ex)port [^'"]+ from\s+)(['"])(\.\.?\/[^'"]+?)(?<!\.ts)\2/g

/**
 * Processes a single file to add .ts extensions to relative imports.
 * @param filePath The path to the TypeScript file.
 */
async function processFile(filePath: string): Promise<void> {
  console.log(`Processing ${filePath}...`)
  try {
    // Read the file content
    const content = await Deno.readTextFile(filePath)

    // Replace imports using the regex
    // $1 = from\s+
    // $2 = quote
    // $3 = path
    const newContent = content.replace(importRegex, "$1$2$3.ts$2")

    // Check if any changes were made
    if (content !== newContent) {
      // Write the modified content back to the file
      await Deno.writeTextFile(filePath, newContent)
      console.log(`  Updated imports in ${filePath}`)
    } else {
      console.log(`  No changes needed for ${filePath}`)
    }
  } catch (e: any) {
    console.error(`Error processing file ${filePath}:`, e.message)
  }
}

// --- Main Execution ---

// Get file paths from command line arguments
const filePaths = Deno.args

if (filePaths.length === 0) {
  console.error("Error: No file paths provided.")
  console.log(
    "Usage: deno run --allow-read --allow-write add_ts_extension.ts <file1.ts> [file2.ts ...]"
  )
  Deno.exit(1) // Exit with error code
}

// Process each file or directory provided as an argument
for (const root of filePaths) {
  const fileInfo = await Deno.stat(root)
  if (fileInfo.isDirectory) {
    for await (const { path, isFile } of expandGlob("**/*.{ts,tsx}", {
      root,
    })) {
      if (isFile) await processFile(path)
    }
  } else {
    await processFile(root)
  }
}

console.log("\nScript finished.")
