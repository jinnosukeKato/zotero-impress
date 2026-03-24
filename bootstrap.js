function install() {}
function uninstall() {}

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
      label: 'PDFを生成 (Impress)', // Since l10n isn't set up yet, using direct label or l10nID
      // icon: `${rootURI}icon.svg`, // Assuming we'll add an icon later
      onShowing: (event, context) => {
        const isOpenOfficeFile = context.items?.some(item => {
          // If the item is not a regular item (e.g., it's a note or a tag), skip it
          if (!item.isRegularItem()) return false;

          // Check if item itself is an attachment or if it has child attachments
          const attachments = item.getAttachments ? item.getAttachments() : [];
          const attachmentItems = Zotero.Items.get(attachments);
          return attachmentItems.some(att =>
            att.attachmentFilename?.endsWith('.odp') ||
            att.attachmentFilename?.endsWith('.odf')
          );
        });
        context.setVisible(isOpenOfficeFile);
      },
      onCommand: async (event, context) => {
        Zotero.debug("PDF generation triggered for items: " + JSON.stringify(context.items?.map(i => i.id)));
        // ここでPDF生成ロジックを叩く
      }
    }]
  });
}

function shutdown() {
  Zotero.debug("Zotero Impress shutdown");
}