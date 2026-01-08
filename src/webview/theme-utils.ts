/**
 * Theme utilities for terminal webviews
 * Reads VS Code CSS variables to resolve terminal colors
 */

import type { TerminalTheme } from "../types/messages";

/**
 * Read theme colors from VS Code CSS variables
 * Priority: editor colors (consistent with font settings), then terminal colors as fallback
 * Note: VS Code has a known bug where webview CSS vars persist across theme changes (#96621)
 */
export function getVSCodeThemeColors(): TerminalTheme {
	const style = getComputedStyle(document.documentElement);
	const get = (name: string, ...fallbacks: string[]): string | undefined => {
		let value = style.getPropertyValue(name).trim();
		if (!value) {
			for (const fallback of fallbacks) {
				value = style.getPropertyValue(fallback).trim();
				if (value) break;
			}
		}
		return value || undefined;
	};

	return {
		// Core colors: editor first, terminal as fallback (matches font settings priority)
		foreground: get(
			"--vscode-editor-foreground",
			"--vscode-foreground",
			"--vscode-terminal-foreground",
		),
		background: get(
			"--vscode-editor-background",
			"--vscode-panel-background",
			"--vscode-terminal-background",
		),
		cursor: get(
			"--vscode-editorCursor-foreground",
			"--vscode-terminalCursor-foreground",
		),
		cursorAccent: get(
			"--vscode-editorCursor-background",
			"--vscode-editor-background",
		),
		// Use editor selection colors for consistency with VS Code editor tabs
		selectionBackground: get(
			"--vscode-editor-selectionBackground",
			"--vscode-terminal-selectionBackground",
		),
		selectionForeground: get(
			"--vscode-editor-selectionForeground",
			"--vscode-terminal-selectionForeground",
		),
		// ANSI colors: terminal-specific (no editor equivalents), fall back to ghostty-web defaults
		black: get("--vscode-terminal-ansiBlack"),
		red: get("--vscode-terminal-ansiRed"),
		green: get("--vscode-terminal-ansiGreen"),
		yellow: get("--vscode-terminal-ansiYellow"),
		blue: get("--vscode-terminal-ansiBlue"),
		magenta: get("--vscode-terminal-ansiMagenta"),
		cyan: get("--vscode-terminal-ansiCyan"),
		white: get("--vscode-terminal-ansiWhite"),
		brightBlack: get("--vscode-terminal-ansiBrightBlack"),
		brightRed: get("--vscode-terminal-ansiBrightRed"),
		brightGreen: get("--vscode-terminal-ansiBrightGreen"),
		brightYellow: get("--vscode-terminal-ansiBrightYellow"),
		brightBlue: get("--vscode-terminal-ansiBrightBlue"),
		brightMagenta: get("--vscode-terminal-ansiBrightMagenta"),
		brightCyan: get("--vscode-terminal-ansiBrightCyan"),
		brightWhite: get("--vscode-terminal-ansiBrightWhite"),
	};
}

/**
 * Create a mutation observer that watches for theme changes and updates terminal theme
 * @param updateTheme - Callback to update terminal theme
 * @returns The MutationObserver instance (call disconnect() to cleanup)
 */
export function createThemeObserver(
	updateTheme: (theme: TerminalTheme) => void,
): MutationObserver {
	const observer = new MutationObserver(() => {
		updateTheme(getVSCodeThemeColors());
	});

	// Watch for theme changes via MutationObserver
	// - body class changes: when VS Code switches dark/light theme
	// - documentElement style changes: when colorCustomizations or theme colors change
	observer.observe(document.body, {
		attributes: true,
		attributeFilter: ["class"],
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["style"],
	});

	return observer;
}
