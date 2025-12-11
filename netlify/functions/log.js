import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("logs");

  const today = new Date().toISOString().split("T")[0];
  const filename = `logs-${today}.txt`;

  const bodyText = await req.text();
  const timestamp = new Date().toISOString();

  const newLog = `${timestamp} - ${bodyText}\n`;

  // 🔥 Não sobrescreve. Adiciona no final mesmo com 100 requisições correndo juntas.
  await store.append(filename, newLog);

  return Response.json({ ok: true });
};
