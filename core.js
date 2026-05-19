const convertOdpToPdf = async (item) => {
  const inputPath = await item.getFilePathAsync();
  if (!inputPath) {
    throw new Error("Input file path could not be resolved");
  }

  const lower = inputPath.toLowerCase();
  if (!EXT_LIST.some(ext => lower.endsWith(ext))) {
    throw new Error("Selected file is not a supported format: " + inputPath);
  }

  const outputDir = Zotero.getTempDirectory().path;
  const libreOfficePath = "/usr/bin/soffice";

  await Zotero.Utilities.Internal.exec(libreOfficePath, [
    "--headless",
    "--convert-to", "pdf",
    inputPath,
    "--outdir", outputDir
  ]);

  const baseName = PathUtils.filename(inputPath).replace(/\.[^.]+$/, "");
  const pdfPath = PathUtils.join(outputDir, `${baseName}.pdf`);

  if (!(await IOUtils.exists(pdfPath))) {
    throw new Error("PDF was not generated: " + pdfPath);
  }

  const parentItemID = item.parentItemID || item.parentID || item.id;
  await Zotero.Attachments.importFromFile({
    file: Zotero.File.pathToFile(pdfPath),
    parentItemID
  });
};

const createAndOpenLibreOfficeSlide = async () => {
  // 選択中のアイテム（親アイテム）を取得
  const pane = Zotero.getActiveZoteroPane();
  const selectedItems = pane.getSelectedItems();
  let parentItem = selectedItems.length > 0 ? selectedItems[0] : null;

  // 親アイテムがRegular Itemでなければ親はないとみなす
  if (parentItem && !parentItem.isRegularItem()) {
    parentItem = null;
  }

  const tempFilePath = PathUtils.join(PathUtils.tempDir, "new_presentation.odp");

  // 現在選択中のコレクションを取得
  const collection = pane.getSelectedCollection();

  try {
    const templateURI = addonRootURI + "content/template.odp";

    const response = await fetch(templateURI);
    if (!response.ok) {
      throw new Error(`Failed to load template from ${templateURI}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await IOUtils.write(tempFilePath, new Uint8Array(arrayBuffer));

    let attachmentOptions = {
      file: tempFilePath,
      title: "New Presentation",
    };

    // 親アイテムがある場合は親を指定する
    if (parentItem) {
      attachmentOptions.parentItemID = parentItem.id;
    } else {
      attachmentOptions.libraryID = Zotero.Libraries.userLibraryID;

      // 開いているコレクションがある場合はそのコレクションに追加するようにオプション指定
      if (collection) {
        attachmentOptions.collections = [collection.id];
      }
    }

    // ファイルをZoteroにインポート
    const attachment = await Zotero.Attachments.importFromFile(attachmentOptions);

    // importFromFileのオプションで追加されなかった場合へのフォールバック
    if (!parentItem && collection && attachment) {
      if (!attachment.getCollections().includes(collection.id)) {
        attachment.setCollections([collection.id]);
        await attachment.saveTx();
      }
    }

    // 一時フォルダに作ったファイルを削除
    await IOUtils.remove(tempFilePath);

    // 作成したアタッチメントをシステム既定のアプリ(LibreOffice)で開く
    if (attachment) {
      const importedPath = await attachment.getFilePathAsync();
      Zotero.launchFile(importedPath);
    }

  } catch (error) {
    Zotero.debug(`[Zotero Impress] Error occurred: ${error}`);
    Components.utils.reportError(error);
  }
}
