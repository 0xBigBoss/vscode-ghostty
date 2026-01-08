/**
 * File existence cache with TTL
 * Extracted from webview/main.ts for testability
 */

export interface CacheEntry {
	exists: boolean;
	timestamp: number;
}

export interface FileCache {
	get(path: string): boolean | undefined;
	set(path: string, exists: boolean): void;
	clear(): void;
	size(): number;
}

/**
 * Create a file existence cache with TTL
 * @param ttlMs - Time-to-live for cache entries in milliseconds
 * @param maxSize - Maximum number of entries before eviction
 */
export function createFileCache(
	ttlMs: number = 5000,
	maxSize: number = 100,
): FileCache {
	const cache = new Map<string, CacheEntry>();

	return {
		get(path: string): boolean | undefined {
			const entry = cache.get(path);
			if (!entry) return undefined;

			// Check if entry is expired
			if (Date.now() - entry.timestamp > ttlMs) {
				cache.delete(path);
				return undefined;
			}

			// LRU: move to end on access (delete and re-add to refresh position)
			cache.delete(path);
			cache.set(path, entry);

			return entry.exists;
		},

		set(path: string, exists: boolean): void {
			// LRU: if key exists, delete first to refresh position (avoids evicting unrelated keys)
			if (cache.has(path)) {
				cache.delete(path);
			} else if (cache.size >= maxSize) {
				// Only evict if adding new key and at capacity
				const firstKey = cache.keys().next().value;
				if (firstKey) cache.delete(firstKey);
			}
			cache.set(path, { exists, timestamp: Date.now() });
		},

		clear(): void {
			cache.clear();
		},

		size(): number {
			return cache.size;
		},
	};
}

/**
 * Path resolution utilities for terminal file links
 */

/**
 * Check if a path is absolute (Unix or Windows)
 */
export function isAbsolutePath(path: string): boolean {
	return path.startsWith("/") || /^[a-zA-Z]:/.test(path);
}

/**
 * Strip git diff prefixes (a/ or b/) from paths
 */
export function stripGitDiffPrefix(path: string): string {
	if (path.startsWith("a/") || path.startsWith("b/")) {
		return path.slice(2);
	}
	return path;
}

/**
 * Resolve a path relative to a CWD
 * Returns the original path if already absolute
 */
export function resolvePath(path: string, cwd?: string): string {
	// Already absolute
	if (isAbsolutePath(path)) {
		return path;
	}
	// Strip git diff prefixes
	path = stripGitDiffPrefix(path);
	// Resolve relative to CWD
	if (cwd) {
		return `${cwd}/${path}`;
	}
	return path;
}

/**
 * Detect if running on Windows
 */
export function isWindowsPlatform(navigator: { platform: string }): boolean {
	// Match Win32, Win64, Windows - but not darwin which contains 'win'
	const platform = navigator.platform.toUpperCase();
	return platform.startsWith("WIN");
}

/**
 * Quote a shell path if it contains special characters
 * Uses POSIX single-quoting for Unix shells, double-quoting for Windows cmd.exe
 */
export function quoteShellPath(
	path: string,
	isWindows: boolean = false,
): string {
	if (isWindows) {
		// Windows cmd.exe: use double quotes, escape internal double quotes with ^
		// Backslashes are literal in cmd.exe (not escape chars)
		if (/[\s"&|<>()^]/.test(path)) {
			return `"${path.replace(/"/g, '^"')}"`;
		}
		return path;
	}
	// POSIX shells: use single quotes, escape internal single quotes
	if (/[\s"'$`\\!&;|<>()]/.test(path)) {
		return `'${path.replace(/'/g, "'\\''")}'`;
	}
	return path;
}
