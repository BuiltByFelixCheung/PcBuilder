export function excelFormData(file: File) {
  const body = new FormData();
  body.append("file", file);
  return body;
}

export function isExcelFile(file: File) {
  return /\.xlsx?$/i.test(file.name);
}
