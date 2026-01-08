import { describe, expect, it } from "vitest";
import { type ConfigGetter, resolveDisplaySettings } from "./settings-resolver";

/**
 * Mock config getter for testing
 */
function createMockConfig(
	values: Record<string, Record<string, unknown>>,
): ConfigGetter {
	return {
		get<T>(section: string, key: string): T | undefined {
			return values[section]?.[key] as T | undefined;
		},
	};
}

describe("resolveDisplaySettings", () => {
	describe("fontFamily priority", () => {
		it("uses ghostty.fontFamily when set", () => {
			const config = createMockConfig({
				ghostty: { fontFamily: "JetBrains Mono" },
				editor: { fontFamily: "Consolas" },
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontFamily).toBe("JetBrains Mono");
		});

		it("falls back to editor.fontFamily when ghostty not set", () => {
			const config = createMockConfig({
				ghostty: {},
				editor: { fontFamily: "Consolas" },
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontFamily).toBe("Consolas");
		});

		it("falls back to monospace when neither set", () => {
			const config = createMockConfig({
				ghostty: {},
				editor: {},
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontFamily).toBe("monospace");
		});

		it("uses ghostty even when editor is set", () => {
			const config = createMockConfig({
				ghostty: { fontFamily: "Fira Code" },
				editor: { fontFamily: "Courier New" },
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontFamily).toBe("Fira Code");
		});
	});

	describe("fontSize priority", () => {
		it("uses ghostty.fontSize when set", () => {
			const config = createMockConfig({
				ghostty: { fontSize: 16 },
				editor: { fontSize: 14 },
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontSize).toBe(16);
		});

		it("falls back to editor.fontSize when ghostty not set", () => {
			const config = createMockConfig({
				ghostty: {},
				editor: { fontSize: 14 },
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontSize).toBe(14);
		});

		it("falls back to 15 when neither set", () => {
			const config = createMockConfig({
				ghostty: {},
				editor: {},
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontSize).toBe(15);
		});

		it("treats 0 as unset (falsy)", () => {
			const config = createMockConfig({
				ghostty: { fontSize: 0 },
				editor: { fontSize: 12 },
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontSize).toBe(12);
		});
	});

	describe("combined settings", () => {
		it("resolves font family and size independently", () => {
			const config = createMockConfig({
				ghostty: { fontSize: 18 }, // Only size from ghostty
				editor: { fontFamily: "Monaco", fontSize: 12 }, // Family from editor
			});

			const settings = resolveDisplaySettings(config);
			expect(settings.fontFamily).toBe("Monaco");
			expect(settings.fontSize).toBe(18);
		});
	});
});
