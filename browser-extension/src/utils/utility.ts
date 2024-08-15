/**
 * Downloads the given data as a JSON file with the specified filename.
 *
 * @param data - The data to be downloaded.
 * @param filename - The default name given to the file to be downloaded.
 */
export const download = (data: Record<string, any>, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};
