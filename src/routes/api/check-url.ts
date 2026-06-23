import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/check-url")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { url?: string; urls?: string[] };
          const inputs = Array.isArray(body.urls)
            ? body.urls.filter((u) => typeof u === "string" && u.trim()).slice(0, 25)
            : body.url
              ? [body.url]
              : [];
          if (!inputs.length) {
            return new Response(JSON.stringify({ error: "Provide 'url' or 'urls'" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          const { scanUrl } = await import("@/lib/phish/scan.server");
          const results = await Promise.all(inputs.map((u) => scanUrl(u)));
          return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
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