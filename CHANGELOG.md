# Changelog

All notable changes to the Ghostty Terminal extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OSC 9 notification support for terminal application notifications
- Bell setting (`ghostty.bell`) to control visual/status notifications
- Keyboard shortcuts: `Ctrl+`` toggle panel, `Ctrl+Shift+`` new terminal
- Tab navigation: `Cmd+Shift+[` / `Cmd+Shift+]` to switch tabs
- `Cmd+Shift+T` opens new terminal in panel
- Theme-aware CSS styling for all UI elements
- SGR mouse reporting for terminal applications (vim, htop, etc.)

### Changed
- Panel now appears in bottom area alongside built-in Terminal
- Terminal focus is automatic after panel toggle

### Fixed
- Tab hover colors now respect VS Code theme
- `Ctrl+`` no longer sent to terminal when toggling panel

## [0.0.1] - 2024-01-01

### Added
- Initial release
- WebGL-based terminal rendering via ghostty-web
- Editor tab and panel-based terminal support
- File path detection and clickable links
- Drag-and-drop file support
- Search in terminal (`Cmd+F`)
- Copy/paste via context menu
- Double-click word selection
- Triple-click line selection
- OSC 7 CWD tracking
- Theme integration with VS Code colors
