import fetch from "node-fetch";

interface IFixitDevice {
  title: string;
  display_title: string;
  url: string;
  wikiid: number;
}

interface IFixitGuideStep {
  title: string;
  instruction: string;
  images?: string[];
}


function deviceSlugFromUrl(url: string) {
  const parts = url.split("/Device/");
  return parts[1] || "";
}


function extractDeviceNameFallback(query: string): string {
  const words = query.split(" ");
  return words.slice(0, 2).join(" "); // e.g., "iPhone 12"
}


async function searchDevice(query: string): Promise<IFixitDevice[]> {
  const url = `https://www.ifixit.com/api/2.0/search/${encodeURIComponent(query)}?filter=device`;
  const res = await fetch(url);
  const data = (await res.json()) as { results?: any[] };
  return (data.results || []).map((d) => ({
    title: d.title || "Unknown",
    display_title: d.title || "Unknown",
    url: d.url || "",
    wikiid: d.wikiid || 0,
  }));
}


async function listGuides(slug: string): Promise<IFixitDevice[]> {
  const url = `https://www.ifixit.com/api/2.0/wikis/CATEGORY/${slug}`;
  const res = await fetch(url);
  const data = (await res.json()) as { results?: any[] };
  return (data.results || []).map((g) => ({
    title: g.title || "Unknown Guide",
    display_title: g.title || "Unknown Guide",
    url: g.url || "",
    wikiid: g.wikiid || 0,
  }));
}


async function getGuide(guideId: number): Promise<IFixitGuideStep[]> {
  const url = `https://www.ifixit.com/api/2.0/guides/${guideId}`;
  const res = await fetch(url);
  const data = (await res.json()) as { steps?: any[] };
  return data.steps?.map((s) => ({
    title: s.title,
    instruction: s.instruction,
    images: s.images || [],
  })) || [];
}


export async function* repairAgent(userQuery: string) {
  yield "🔍 Extracting device name from your query...\n";

  const deviceName = extractDeviceNameFallback(userQuery);
  yield `🛠 Device detected: ${deviceName}\n`;

  yield "🔍 Searching iFixit for your device...\n";
  const devices = await searchDevice(deviceName);

  if (!devices.length) {
    yield "⚠️ No official guides found. Searching community solutions...\n";
    yield "🔗 [Fallback search not implemented yet]\n";
    return;
  }

  const device = devices[0];
  yield `✅ Found device: ${device.display_title}\n`;

  const slug = deviceSlugFromUrl(device.url);
  yield `🔍 Searching guides for device slug: ${slug}\n`;

  const guides = await listGuides(slug);
  if (!guides.length) {
    yield "⚠️ No repair guides available for this device.\n";
    return;
  }

  // pick the guide that best matches the user query
  const guide = guides.find((g) =>
    g.display_title.toLowerCase().includes(userQuery.toLowerCase())
  ) || guides[0];

  if (!guide || !guide.wikiid) {
    yield "⚠️ Could not find a suitable repair guide.\n";
    return;
  }

  yield `🔧 Loading repair guide: ${guide.display_title}\n`;

  const steps = await getGuide(guide.wikiid);
  for (const step of steps) {
    let stepText = `**${step.title}**\n${step.instruction}\n`;
    if (step.images?.length) {
      stepText += step.images.map((img) => `![image](${img})`).join("\n") + "\n";
    }
    yield stepText;
  }

  yield "✅ Repair guide completed!\n";
}
