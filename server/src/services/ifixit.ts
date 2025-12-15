import fetch from "node-fetch";


interface IFixitGuide {
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

interface IFixitSearchResponse {
  results?: any[];
}

interface IFixitGuideResponse {
  steps?: any[];
}


function extractDeviceNameFallback(query: string): string {
  const words = query.trim().split(/\s+/);
  return words.slice(0, 2).join(" "); 
}


async function searchGuides(query: string): Promise<IFixitGuide[]> {
  const url = `https://www.ifixit.com/api/2.0/search/${encodeURIComponent(
    query
  )}?filter=guide&limit=10`;

  const res = await fetch(url);
  const data = (await res.json()) as IFixitSearchResponse;

  return (data.results || [])
    .filter((r) => r?.dataType === "guide")
    .map((g) => ({
      title: g.title || "Unknown Guide",
      display_title: g.title || "Unknown Guide",
      url: g.url || "",
      wikiid: g.guideid || 0,
    }));
}


async function getGuide(guideId: number): Promise<IFixitGuideStep[]> {
  const url = `https://www.ifixit.com/api/2.0/guides/${guideId}`;
  const res = await fetch(url);
  const data = (await res.json()) as IFixitGuideResponse;

  return (data.steps || []).map((step) => {
    const instruction =
      (step.lines && step.lines.map((l: any) => l.text).join("\n")) ||
      step.summary ||
      "Follow the images carefully for this step.";

    return {
      title: step.title || "Step",
      instruction: instruction.trim(),
      images: (step.media?.images || []).map(
        (img: any) => img.standard || img.large
      ),
    };
  });
}


export async function* repairAgent(userQuery: string) {
  yield "🔍 Extracting device name from your query...\n";

  const deviceName = extractDeviceNameFallback(userQuery);
  yield `🛠 Device detected: ${deviceName}\n`;

  yield "🔍 Searching for repair guides...\n";
  const guides = await searchGuides(userQuery);

  if (!guides.length) {
    yield "⚠️ No repair guides available for this query.\n";
    return;
  }

  const guide = guides[0];
  yield `🔧 Loading repair guide: ${guide.display_title}\n`;

  const steps = await getGuide(guide.wikiid);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    let stepText = `### Step ${i + 1}: ${step.title}\n`;
    stepText += `${step.instruction}\n`;

    if (step.images?.length) {
      stepText += step.images
        .map((img) => `![image](${img})`)
        .join("\n");
      stepText += "\n";
    }

    yield stepText;
  }

  yield "✅ Repair guide completed!\n";
}
