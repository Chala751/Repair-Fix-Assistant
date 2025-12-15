export function cleanIFixitJSON(raw: any[]) {
  return raw.map((item: any) => ({
    title: item.display_title,
    text: item.text,
    images: item.image ? Object.values(item.image) : [],
  }));
}
