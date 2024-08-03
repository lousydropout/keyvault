export async function queryData(
  method: string,
  queryParams: Record<string, any>
): Promise<unknown> {
  const apiUrl = "https://keyvault-query.lousydropout.com";

  // Constructing query string from query params object
  const queryString = new URLSearchParams(queryParams).toString();

  // Constructing final URL with query string
  const url = `${apiUrl}/${method}?${queryString}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Network response was not ok.");
  }

  const data = await response.json();
  return data.Ok;
}
