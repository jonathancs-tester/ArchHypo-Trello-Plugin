import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("logs");

  const today = new Date().toISOString().split("T")[0];
  const filename = `logs-${today}.txt`;

  const bodyText = await req.text();
  const timestamp = new Date().toISOString();

  const newLog = `${timestamp} - ${bodyText}\n`;

  // 🔥 AQUI é o append certo
  await store.set(filename, newLog, { append: true });

  return Response.json({ ok: true });
};
