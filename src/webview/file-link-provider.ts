/**
 * File path link provider for terminal webview
 * Detects file paths in terminal output and makes them clickable
 */

import { resolvePath } from "../file-cache";

// Pre-compiled file path patterns for link detection performance
// Matches: Unix paths (/path/file.ts, ./rel.ts), Windows (C:\file.ts, C:/file.ts)
// Optional :line:col or (line,col) suffix
const FILE_PATH_PATTERN_GLOBAL =
	/(?:^|[\s'"(])((?:[a-zA-Z]:)?(?:\.{0,2}[\\/])?[\w.\\/-]+\.[a-zA-Z0-9]+)(?:[:(](\d+)(?:[,:](\d+))?[\])]?)?/g;

export const FILE_PATH_PATTERN_SINGLE =
	/^((?:[a-zA-Z]:)?(?:\.{0,2}[\\/])?[\w.\\/-]+\.[a-zA-Z0-9]+)(?:[:(](\d+)(?:[,:](\d+))?[\])]?)?$/;

/** Terminal buffer interface for link provider */
interface TerminalBuffer {
	active?: {
		getLine(
			y: number,
		): { translateToString(trimRight: boolean): string } | undefined;
	};
}

/** File link match with position information */
interface FileLinkMatch {
	text: string;
	path: string;
	line?: number;
	column?: number;
	startX: number;
	endX: number;
}

/** Link range for terminal link provider */
interface LinkRange {
	start: { x: number; y: number };
	end: { x: number; y: number };
}

/** Terminal link for link provider callback */
interface TerminalLink {
	text: string;
	range: LinkRange;
	activate: (event: MouseEvent) => void;
}

/** Options for creating file link provider */
export interface FileLinkProviderOptions {
	/** Get current working directory */
	getCwd: () => string | undefined;
	/** Check if a file exists (async) */
	checkFileExists: (path: string) => Promise<boolean>;
	/** Handle file link click */
	onFileClick: (path: string, line?: number, column?: number) => void;
}

/**
 * Create a file path link provider for the terminal
 * @param buffer - Terminal buffer for reading line content
 * @param options - Provider options
 */
export function createFileLinkProvider(
	buffer: TerminalBuffer,
	options: FileLinkProviderOptions,
): {
	provideLinks: (
		y: number,
		callback: (links: TerminalLink[] | undefined) => void,
	) => void;
} {
	const { getCwd, checkFileExists, onFileClick } = options;

	return {
		provideLinks(
			y: number,
			callback: (links: TerminalLink[] | undefined) => void,
		): void {
			// Get the line text from terminal buffer
			if (!buffer.active) {
				callback(undefined);
				return;
			}
			const line = buffer.active.getLine(y);
			if (!line) {
				callback(undefined);
				return;
			}
			const lineText = line.translateToString(true);
			if (!lineText) {
				callback(undefined);
				return;
			}

			// Early-out: all file paths have extensions (contain '.')
			if (!lineText.includes(".")) {
				callback(undefined);
				return;
			}

			// Reset lastIndex for global regex re-use
			FILE_PATH_PATTERN_GLOBAL.lastIndex = 0;

			const matches: FileLinkMatch[] = [];

			let match;
			while ((match = FILE_PATH_PATTERN_GLOBAL.exec(lineText)) !== null) {
				const fullMatch = match[0];
				const path = match[1];
				const lineNum = match[2] ? parseInt(match[2], 10) : undefined;
				const colNum = match[3] ? parseInt(match[3], 10) : undefined;

				// Calculate start position (skip leading whitespace/quote)
				let startX = match.index;
				// Skip prefix character if not start of path
				const firstChar = fullMatch[0];
				if (
					firstChar !== "." &&
					firstChar !== "/" &&
					firstChar !== "\\" &&
					!/[a-zA-Z]/.test(firstChar)
				) {
					startX += 1; // Skip the prefix character
				}

				matches.push({
					text:
						path +
						(lineNum ? `:${lineNum}` : "") +
						(colNum ? `:${colNum}` : ""),
					path,
					line: lineNum,
					column: colNum,
					startX,
					endX:
						startX +
						path.length +
						(lineNum ? String(lineNum).length + 1 : 0) +
						(colNum ? String(colNum).length + 1 : 0),
				});
			}

			if (matches.length === 0) {
				callback(undefined);
				return;
			}

			// Validate and create links asynchronously
			const validateAndCreateLinks = async () => {
				const cwd = getCwd();

				// Check all paths in parallel to benefit from batching
				const existsResults = await Promise.all(
					matches.map((m) => {
						const absolutePath = resolvePath(m.path, cwd);
						return checkFileExists(absolutePath);
					}),
				);

				// Filter to only matches where file exists and create links
				const links: TerminalLink[] = [];
				for (let i = 0; i < matches.length; i++) {
					if (existsResults[i]) {
						const m = matches[i];
						links.push({
							text: m.text,
							range: {
								start: { x: m.startX, y },
								end: { x: m.endX, y },
							},
							activate: (event: MouseEvent) => {
								// Only open on Ctrl/Cmd+Click (standard terminal behavior)
								if (event.ctrlKey || event.metaKey) {
									onFileClick(m.path, m.line, m.column);
								}
							},
						});
					}
				}
				callback(links.length > 0 ? links : undefined);
			};

			validateAndCreateLinks();
		},
	};
}
