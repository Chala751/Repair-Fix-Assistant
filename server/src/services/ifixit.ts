export async function* repairAgent(query: string) {
  yield "🔍 Searching iFixit for your device...\n";

  // Simulate some steps
  await new Promise((r) => setTimeout(r, 1000));
  yield "Step 1: Unplug your device.\n";

  await new Promise((r) => setTimeout(r, 1000));
  yield "Step 2: Open the back panel.\n";

  await new Promise((r) => setTimeout(r, 1000));
  yield "Step 3: Replace the faulty component.\n";

  await new Promise((r) => setTimeout(r, 1000));
  yield "✅ Repair guide completed!\n";
}
