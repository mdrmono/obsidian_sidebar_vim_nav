const { Plugin } = require('obsidian');

class SidebarVimNavPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.selectedIndex = 0;
    this.isActive = false;
    this.lastKeyPress = { key: null, time: 0 };
  }

  async onload() {
    // Add command to toggle sidebar navigation
    this.addCommand({
      id: 'activate-sidebar-nav',
      name: 'Toggle sidebar vim navigation',
      callback: () => {
        if (this.isActive) {
          this.deactivate();
          this.app.workspace.leftSplit.collapse();
        } else {
          this.activateSidebarNav();
        }
      },
      hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'e' }]
    });

    // Global keydown handler
    this.registerDomEvent(document, 'keydown', (evt) => {
      if (!this.isActive) return;

      // Escape to deactivate
      if (evt.key === 'Escape') {
        this.deactivate();
        return;
      }

      const items = this.getNavigableItems();
      if (items.length === 0) return;

      switch (evt.key) {
        case 'j':
          evt.preventDefault();
          evt.stopPropagation();
          this.navigateDown(items);
          break;
        case 'k':
          evt.preventDefault();
          evt.stopPropagation();
          this.navigateUp(items);
          break;
        case 'l':
        case 'Enter':
          evt.preventDefault();
          evt.stopPropagation();
          this.openOrExpand(items);
          break;
        case 'h':
          evt.preventDefault();
          evt.stopPropagation();
          this.collapseOrGoUp(items);
          break;
        case 'g':
          evt.preventDefault();
          evt.stopPropagation();
          const now = Date.now();
          if (this.lastKeyPress.key === 'g' && now - this.lastKeyPress.time < 500) {
            this.selectedIndex = 0;
            this.highlightItem(items);
            this.lastKeyPress = { key: null, time: 0 };
          } else {
            this.lastKeyPress = { key: 'g', time: now };
          }
          break;
        case 'G':
          evt.preventDefault();
          evt.stopPropagation();
          this.selectedIndex = items.length - 1;
          this.highlightItem(items);
          break;
        case 'z':
          evt.preventDefault();
          evt.stopPropagation();
          this.lastKeyPress = { key: 'z', time: Date.now() };
          break;
        case 'M':
          evt.preventDefault();
          evt.stopPropagation();
          if (this.lastKeyPress.key === 'z' && Date.now() - this.lastKeyPress.time < 500) {
            this.collapseAllFolders();
            this.lastKeyPress = { key: null, time: 0 };
          }
          break;
      }
    }, true); // Use capture phase

    // Click anywhere to deactivate
    this.registerDomEvent(document, 'click', (evt) => {
      const sidebar = document.querySelector('.workspace-leaf-content[data-type="file-explorer"]');
      if (this.isActive && sidebar && !sidebar.contains(evt.target)) {
        this.deactivate();
      }
    });

    // Deactivate when sidebar is collapsed/hidden
    this.registerEvent(this.app.workspace.on('layout-change', () => {
      if (!this.isActive) return;
      // Small delay to ensure DOM state is updated
      setTimeout(() => {
        if (!this.isActive) return;
        const isHidden = this.app.workspace.leftSplit.collapsed;
        if (isHidden) {
          this.deactivate();
        }
      }, 10);
    }));

    // Also watch for sidebar collapse via resize observer
    this.registerEvent(this.app.workspace.on('resize', () => {
      if (!this.isActive) return;
      if (this.app.workspace.leftSplit.collapsed) {
        this.deactivate();
      }
    }));

    // Deactivate when Ctrl+Shift+B is pressed (toggle left sidebar)
    this.registerDomEvent(document, 'keydown', (evt) => {
      if (this.isActive && evt.ctrlKey && evt.shiftKey && evt.key.toLowerCase() === 'b') {
        setTimeout(() => this.deactivate(), 50);
      }
    });

    // Add styles for highlighting
    this.addStyles();

    console.log('Sidebar Vim Navigation loaded - Press Ctrl+E to activate');
  }

  addStyles() {
    const style = document.createElement('style');
    style.id = 'sidebar-vim-nav-styles';
    style.textContent = `
      .sidebar-vim-nav-active .tree-item-self.vim-selected,
      .sidebar-vim-nav-active .nav-file-title.vim-selected,
      .sidebar-vim-nav-active .nav-folder-title.vim-selected {
        background-color: color-mix(in srgb, var(--interactive-accent) 40%, transparent) !important;
      }
    `;
    document.head.appendChild(style);
  }

  activateSidebarNav() {
    // Show file explorer if hidden
    this.app.workspace.leftSplit.expand();

    // Wait a bit for DOM to update
    setTimeout(() => {
      const items = this.getNavigableItems();
      if (items.length === 0) {
        console.log('No items found in file explorer');
        return;
      }

      this.isActive = true;
      document.body.classList.add('sidebar-vim-nav-active');

      // Find currently active file and select it
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        const activePath = activeFile.path;
        items.forEach((item, idx) => {
          const path = item.closest('[data-path]')?.getAttribute('data-path');
          if (path === activePath) {
            this.selectedIndex = idx;
          }
        });
      }

      this.selectedIndex = Math.min(this.selectedIndex, items.length - 1);
      this.highlightItem(items);
    }, 50);
  }

  deactivate() {
    this.isActive = false;
    document.body.classList.remove('sidebar-vim-nav-active');
    this.clearHighlight();
  }

  getNavigableItems() {
    const container = document.querySelector('.nav-files-container');
    if (!container) return [];

    // Try newer Obsidian selectors first, then fallback
    let items = Array.from(container.querySelectorAll('.tree-item-self'));

    if (items.length === 0) {
      items = Array.from(container.querySelectorAll('.nav-file-title, .nav-folder-title'));
    }

    // Filter out items inside collapsed folders
    return items.filter(item => {
      let parent = item.parentElement;
      while (parent && parent !== container) {
        if (parent.classList.contains('is-collapsed')) {
          // Check if this item is the folder title itself
          const folderTitle = parent.querySelector(':scope > .tree-item-self, :scope > .nav-folder-title');
          if (folderTitle !== item) {
            return false;
          }
        }
        parent = parent.parentElement;
      }
      return true;
    });
  }

  highlightItem(items) {
    this.clearHighlight();
    if (items[this.selectedIndex]) {
      items[this.selectedIndex].classList.add('vim-selected');
      items[this.selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  clearHighlight() {
    document.querySelectorAll('.vim-selected').forEach(el => {
      el.classList.remove('vim-selected');
    });
  }

  navigateDown(items) {
    if (this.selectedIndex < items.length - 1) {
      this.selectedIndex++;
      this.highlightItem(items);
    }
  }

  navigateUp(items) {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.highlightItem(items);
    }
  }

  collapseAllFolders() {
    const container = document.querySelector('.nav-files-container');
    if (!container) return;

    const expandedFolders = container.querySelectorAll('.tree-item:not(.is-collapsed), .nav-folder:not(.is-collapsed)');
    expandedFolders.forEach(folder => {
      const collapseIcon = folder.querySelector(':scope > .tree-item-self .collapse-icon, :scope > .nav-folder-title .nav-folder-collapse-indicator');
      if (collapseIcon) {
        collapseIcon.click();
      }
    });

    // Reset selection to first item after collapse
    setTimeout(() => {
      this.selectedIndex = 0;
      const items = this.getNavigableItems();
      this.highlightItem(items);
    }, 50);
  }

  openOrExpand(items) {
    const selected = items[this.selectedIndex];
    if (!selected) return;

    const treeItem = selected.closest('.tree-item') || selected.closest('.nav-folder, .nav-file');
    const isFolder = treeItem?.classList.contains('nav-folder') ||
                     selected.closest('.nav-folder-title') ||
                     treeItem?.querySelector('.tree-item-children, .nav-folder-children');

    if (isFolder) {
      const isCollapsed = treeItem?.classList.contains('is-collapsed');
      // Toggle folder collapse/expand
      const collapseIcon = selected.querySelector('.collapse-icon, .nav-folder-collapse-indicator');
      if (collapseIcon) {
        collapseIcon.click();
      } else {
        selected.click();
      }
      // Refresh items after toggle
      setTimeout(() => {
        const newItems = this.getNavigableItems();
        // Ensure selectedIndex is still valid
        this.selectedIndex = Math.min(this.selectedIndex, newItems.length - 1);
        this.highlightItem(newItems);
      }, 50);
    } else {
      // Open file
      const path = treeItem?.getAttribute('data-path') ||
                   selected.closest('[data-path]')?.getAttribute('data-path');
      if (path) {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) {
          this.app.workspace.openLinkText(path, '', false);
          this.deactivate();
        }
      } else {
        // Fallback: just click
        selected.click();
        this.deactivate();
      }
    }
  }

  collapseOrGoUp(items) {
    const selected = items[this.selectedIndex];
    if (!selected) return;

    const treeItem = selected.closest('.tree-item') || selected.closest('.nav-folder, .nav-file');
    const isFolder = treeItem?.classList.contains('nav-folder') ||
                     selected.closest('.nav-folder-title') ||
                     treeItem?.querySelector('.tree-item-children, .nav-folder-children');

    if (isFolder && !treeItem?.classList.contains('is-collapsed')) {
      // Collapse this folder
      const collapseIcon = selected.querySelector('.collapse-icon, .nav-folder-collapse-indicator');
      if (collapseIcon) {
        collapseIcon.click();
      } else {
        selected.click();
      }
      setTimeout(() => {
        const newItems = this.getNavigableItems();
        this.highlightItem(newItems);
      }, 50);
    } else {
      // Go to parent folder
      const parentFolder = treeItem?.parentElement?.closest('.tree-item, .nav-folder');
      if (parentFolder) {
        const parentTitle = parentFolder.querySelector(':scope > .tree-item-self, :scope > .nav-folder-title');
        if (parentTitle) {
          const newItems = this.getNavigableItems();
          const parentIndex = newItems.indexOf(parentTitle);
          if (parentIndex !== -1) {
            this.selectedIndex = parentIndex;
            this.highlightItem(newItems);
          }
        }
      }
    }
  }

  onunload() {
    this.deactivate();
    const style = document.getElementById('sidebar-vim-nav-styles');
    if (style) style.remove();
    console.log('Sidebar Vim Navigation unloaded');
  }
}

module.exports = SidebarVimNavPlugin;
