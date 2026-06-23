import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/report")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { url?: string; note?: string };
          if (!body.url || typeof body.url !== "string" || body.url.length > 2048) {
            return new Response(JSON.stringify({ error: "Invalid URL" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          console.log(
            "[phishguard:report]",
            JSON.stringify({
              at: new Date().toISOString(),
              url: body.url,
              note: (body.note ?? "").slice(0, 500),
            }),
          );
          return new Response(
            JSON.stringify({
              ok: true,
              message:
                "Report logged. For wider impact, also submit at https://phishtank.org/ and https://safebrowsing.google.com/safebrowsing/report_phish/",
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
          );
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});