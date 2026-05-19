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

async function createAndOpenLibreOfficeSlide() {
  // 1. 選択中のアイテム（親アイテム）を取得
  const pane = Zotero.getActiveZoteroPane();
  const selectedItems = pane.getSelectedItems();
  let parentItem = selectedItems.length > 0 ? selectedItems[0] : null;

  // 親アイテムが通常の文献（Regular Item）でない場合はスタンドアロンとして扱う
  if (parentItem && !parentItem.isRegularItem()) {
    parentItem = null;
  }

  // 現在開いている（選択中の）コレクションを取得
  const collection = pane.getSelectedCollection();

  // 2. パスの設定
  const tempDir = PathUtils.tempDir;
  const newFileName = "新規プレゼンテーション.odp";
  const tempFilePath = PathUtils.join(tempDir, newFileName);

  try {
    // プラグイン同梱のテンプレートファイルの絶対パスを取得
    const templateURL = addonRootURI + "content/template.odp";

    // fetch APIを使ってテンプレートを読み込み、一時ファイルに保存
    const response = await fetch(templateURL);
    if (!response.ok) {
      throw new Error(`Failed to load template from ${templateURL}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    await IOUtils.write(tempFilePath, new Uint8Array(arrayBuffer));

    // 3. Zoteroのインポートオプションを設定
    let attachmentOptions = {
      file: tempFilePath,
      title: "LibreOffice Slide",
    };

    if (parentItem) {
      attachmentOptions.parentItemID = parentItem.id;
    } else {
      // 親が無い場合は現在のユーザーライブラリのスタンドアロンアイテムにする
      attachmentOptions.libraryID = Zotero.Libraries.userLibraryID;

      // 開いているコレクションがある場合はそのコレクションに追加するようにオプション指定
      if (collection) {
        attachmentOptions.collections = [collection.id];
      }
    }

    // Zotero内にファイルをインポート（storageディレクトリへの配置も自動で行われます）
    const attachment = await Zotero.Attachments.importFromFile(attachmentOptions);

    // importFromFileのオプションで追加されなかった場合へのフォールバック（念ため）
    if (!parentItem && collection && attachment) {
      if (!attachment.getCollections().includes(collection.id)) {
        attachment.setCollections([collection.id]);
        await attachment.saveTx();
      }
    }

    // 4. 一時フォルダに作ったファイルは不要になったので削除
    await IOUtils.remove(tempFilePath);

    // 5. 作成したアタッチメントをシステム既定のアプリ（LibreOffice）で開く
    if (attachment) {
      const importedPath = await attachment.getFilePathAsync();
      Zotero.launchFile(importedPath);
    }

  } catch (error) {
    Zotero.debug(`[Zotero Impress] エラーが発生しました: ${error}`);
    Components.utils.reportError(error);
  }
}
