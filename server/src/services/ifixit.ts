import fetch from "node-fetch";
import { cleanIFixitJSON } from "../utils/cleanup";

interface IFixitDevice {
  display_title: string;
  text: string;
  image?: Record<string, string>;
}

interface IFixitGuideStep {
  title: string;
  instruction: string;
  images?: string[];
}


export async function searchDevice(query: string) {
  const url = `https://www.ifixit.com/api/2.0/search/${encodeURIComponent(query)}?filter=device`;
  const res = await fetch(url);
  const data = (await res.json()) as { results?: IFixitDevice[] };
  return cleanIFixitJSON(data.results || []);
}


export async function listGuides(deviceTitle: string) {
  const url = `https://www.ifixit.com/api/2.0/wikis/CATEGORY/${encodeURIComponent(deviceTitle)}`;
  const res = await fetch(url);
  const data = (await res.json()) as { results?: IFixitDevice[] }; 
  return cleanIFixitJSON(data.results || []);
}


export async function getGuide(guideId: string) {
  const url = `https://www.ifixit.com/api/2.0/guides/${guideId}`;
  const res = await fetch(url);
  const data = (await res.json()) as { steps?: IFixitGuideStep[] }; 

  
  const steps = data.steps?.map((s) => ({
    title: s.title,
    text: s.instruction,
    images: s.images || [],
  })) || [];

  return steps;
}


export async function* repairAgent(query: string) {
  yield "🔍 Searching iFixit for your device...\n";

  const devices = await searchDevice(query);

  if (!devices.length) {
    yield "⚠️ No official guides found. Searching community solutions...\n";
    // TODO: Add fallback search (DuckDuckGo / Tavily)
    yield "🔗 [Fallback search not implemented yet]\n";
    return;
  }

  const device = devices[0];
  yield ` Found device: ${device.title}\n`;

  const guides = await listGuides(device.title);
  if (!guides.length) {
    yield " No repair guides available for this device.\n";
    return;
  }

  const guide = guides[0];
  yield `🔧 Loading repair guide: ${guide.title}\n`;

  const steps = await getGuide(guide.title);
  for (const step of steps) {
    let stepText = `**${step.title}**\n${step.text}\n`;
    if (step.images.length) {
      stepText += step.images.map((img) => `![image](${img})`).join("\n") + "\n";
    }
    yield stepText;
  }

  yield " Repair guide completed!\n";
}
