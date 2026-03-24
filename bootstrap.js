function install() { }
function uninstall() { }

function hasImpressFile(item) {
  const filename = item?.attachmentFilename?.toLowerCase?.() || "";
  if (filename.endsWith(".odp") || filename.endsWith(".odf")) {
    return true;
  }

  if (!item?.isRegularItem?.()) {
    return false;
  }

  const attachmentIDs = item.getAttachments ? item.getAttachments() : [];
  if (!attachmentIDs.length) {
    return false;
  }

  const attachmentItems = Zotero.Items.get(attachmentIDs) || [];
  return attachmentItems.some(att => {
    const name = att?.attachmentFilename?.toLowerCase?.() || "";
    return name.endsWith(".odp") || name.endsWith(".odf");
  });
}

async function startup({ id, version, rootURI }) {
  Zotero.debug("Zotero Impress started up");
  const pluginID = "zotero-impress@jinnosukekato.github.io";

  // Register the right-click menu for items
  Zotero.MenuManager.registerMenu({
    menuID: `${pluginID}-menu`,
    pluginID: pluginID,
    target: 'main/library/item',
    menus: [{
      menuType: 'menuitem',
      // icon: `${rootURI}icon.svg`, // Assuming we'll add an icon later
      onShowing: (event, context) => {
        const items = context.items || [];
        const menuElem = context.menuElem;
        if (menuElem) {
          menuElem.label = 'PDFを生成 (Impress)';
        }
        context.setVisible(items.some(hasImpressFile));
      },
      onCommand: async (event, context) => {
        const itemIDs = (context.items || []).map(i => i.id);
        Zotero.debug('PDF generation triggered for items: ' + JSON.stringify(itemIDs));
      }
    }]
  });
}

function shutdown() {
  Zotero.debug("Zotero Impress shutdown");
}
