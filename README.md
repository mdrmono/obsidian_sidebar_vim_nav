# Sidebar Vim Navigation

An Obsidian plugin that adds vim-style keyboard navigation to the file explorer sidebar.

## Features

- Navigate the file explorer without using the mouse
- Familiar vim keybindings for efficient navigation
- Visual highlighting of the currently selected item
- Automatic selection of the active file when activated

## Keybindings

| Key | Action |
|-----|--------|
| `Ctrl+Shift+E` | Toggle sidebar vim navigation mode |
| `j` | Move down |
| `k` | Move up |
| `l` / `Enter` | Open file or expand folder |
| `h` | Collapse folder or go to parent |
| `gg` | Jump to first item |
| `G` | Jump to last item |
| `zM` | Collapse all folders |
| `Escape` | Deactivate navigation mode |
| `Alt+j` | Go to tab on the left |
| `Alt+;` | Go to tab on the right |

## Usage

1. Press `Ctrl+Shift+E` to activate vim navigation in the sidebar
2. Use `j`/`k` to move up and down through files and folders
3. Press `l` or `Enter` to open a file or expand a folder
4. Press `h` to collapse a folder or navigate to the parent folder
5. Press `Escape` or `Ctrl+Shift+E` again to deactivate

When activated, the sidebar will automatically expand if hidden, and the currently open file will be selected.

## Installation

### Manual Installation

1. Copy `main.js` and `manifest.json` to your vault's plugins folder: `<vault>/.obsidian/plugins/sidebar-vim-nav/`
2. Reload Obsidian
3. Enable the plugin in Settings > Community plugins

## License

MIT
