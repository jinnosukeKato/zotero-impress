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
