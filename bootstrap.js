const install = () => { };
const uninstall = () => { };

let addonFTL = null;

const loadFTLIntoWindow = (window) => {
  if (!window?.MozXULElement) {
    return;
  }
  window.MozXULElement.insertFTLIfNeeded(addonFTL);
};

const hasODPFile = (item) => {
  const filename = item?.attachmentFilename?.toLowerCase?.() || "";
  if (filename.endsWith(".odp")) {
    return true;
  }

  if (!item?.isRegularItem?.()) {
    return false;
  }

  const attachmentIDs = item.getAttachments ? item.getAttachments() : [];
  if (!attachmentIDs.length) {
    return false;
  }
};

const startup = async ({ id, version, rootURI }) => {
  Zotero.debug("Zotero Impress started up");
  const pluginID = "zotero-impress@jinnosukekato.github.io";
  addonFTL = "zotero-impress-addon.ftl";
  Services.scriptloader.loadSubScript(rootURI + "core.js");
  for (const window of Zotero.getMainWindows()) {
    if (!window.ZoteroPane) {
      continue;
    }
    loadFTLIntoWindow(window);
  }

  // Register the right-click menu for items
  Zotero.MenuManager.registerMenu({
    menuID: `${pluginID}-menu`,
    pluginID: pluginID,
    target: 'main/library/item',
    menus: [{
      menuType: 'menuitem',
      l10nID: 'zotero-impress-menu-generate-pdf',
      onShowing: (event, context) => {
        const items = context.items || [];
        const menuElem = context.menuElem;
        context.setVisible(items.some(hasODPFile));
      },
      onCommand: async (event, context) => {
        const itemIDs = (context.items || []).map(i => i.id);
        Zotero.debug('PDF generation triggered for items: ' + JSON.stringify(itemIDs));
        for (const itemID of itemIDs) {
          const item = Zotero.Items.get(itemID);
          if (item) {
            await convertOdpToPdf(item);
          }
        }
      }
    }]
  });
};

const shutdown = () => {
  Zotero.debug("Zotero Impress shutdown");
};

const onMainWindowLoad = ({ window }) => {
  loadFTLIntoWindow(window);
};
