async function convertOdpToPdf(item) {
  const odpPath = await item.getFilePathAsync();
  const libreOfficePath = "/usr/bin/soffice";

  const process = new Zotero.Process.run(libreOfficePath, [
    "--headless",
    "--convert-to", "pdf",
    odpPath,
    "--outdir", Zotero.getTempDirectory().path
  ]);

  const exitCode = await process.finished;

  if (exitCode === 0) {
    await Zotero.Attachments.importRelativeFile(pdfPath, item.parentID);
  }
}