import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const store = getStore("logs");

  const today = new Date().toISOString().split("T")[0]; // ex: 2025-12-10
  const filename = `logs-${today}.txt`;

  const body = req.body || "Sem conteúdo";
  const timestamp = new Date().toISOString();

  // Lê o conteúdo atual
  const current = (await store.get(filename, { type: "text" })) || "";

  // Monta a nova linha com timestamp
  const newLog = `${timestamp} - ${body}\n`;

  // Guarda novamente
  await store.set(filename, current + newLog);

  return Response.json({ ok: true, message: "Log registrado!", filename });
};
