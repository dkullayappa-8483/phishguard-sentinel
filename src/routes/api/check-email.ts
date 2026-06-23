import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/check-email")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const { raw } = (await request.json()) as { raw?: string };
          if (!raw || typeof raw !== "string") {
            return new Response(JSON.stringify({ error: "Provide 'raw' email text" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          if (raw.length > 200_000) {
            return new Response(JSON.stringify({ error: "Email too large (>200KB)" }), {
              status: 413,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          const { scanEmail } = await import("@/lib/phish/email.server");
          const result = await scanEmail(raw);
          return new Response(JSON.stringify({ result }), {
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