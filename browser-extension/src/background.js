// Clicking the toolbar icon opens the panel. Feature-detect instead of
// sniffing user agent: Chrome/Edge expose chrome.sidePanel, Firefox exposes
// browser.sidebarAction (sidebar_action in the manifest, closed at install).
const api = globalThis.browser || globalThis.chrome;

if (api.sidePanel?.setPanelBehavior) {
  // Chrome / Edge: make the action icon open the side panel directly.
  api.runtime.onInstalled.addListener(() => {
    api.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  });
} else if (api.sidebarAction && api.action) {
  // Firefox: toggle the sidebar on toolbar-icon click (open_at_install: false).
  api.action.onClicked.addListener(() => {
    api.sidebarAction.toggle();
  });
}
