import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("logs");

  const today = new Date().toISOString().split("T")[0];
  const filename = `logs-${today}.txt`;

  // SEMPRE funciona
  const bodyText = await req.text();

  const timestamp = new Date().toISOString();
  const current = (await store.get(filename, { type: "text" })) || "";

  const newLog = `${timestamp} - ${bodyText}\n`;

  await store.set(filename, current + newLog);

  return Response.json({ ok: true });
};
