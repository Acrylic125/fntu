import { app } from "./app";
import { nanoid } from "nanoid";
import { createDecoder, createSigner, createVerifier } from "fast-jwt";
import z from "zod";

export interface Env {
  SIMPLE_RATE_LIMITER: RateLimit;
  ASSETS: Fetcher;
  fntu_api_kv: KVNamespace;

  // Vars
  DATABASE_URL: string;
}

const JWTSchema = z.object({
  sub: z.string(),
});

const KVAPIKeysSchema = z.array(z.string());

// Using HS256 by default.
const signSync = createSigner({ key: async () => "secret", expiresIn: "1m" });
const verifySync = createVerifier({ key: async () => "secret" });

app.post("/create-token", async (c) => {
  const { fntu_api_kv } = c.env as Env;
  const userId = "123";
  const token = await signSync({
    sub: userId,
  });
  await fntu_api_kv.put(`api-keys-${userId}`, JSON.stringify([token]), {
    expirationTtl: 60 * 60 * 24, // 24 hours
  });
  return c.json({ token });
});

app.get("/get-token", async (c) => {
  const { fntu_api_kv } = c.env as Env;
  const userId = "123";
  const token = await fntu_api_kv.get(`api-keys-${userId}`);
  return c.json({ token });
});

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);

    // Only apply rate limiting to API routes.
    if (pathname.startsWith("/api/")) {
      let apiKey = request.headers.get("Authorization");
      if (!apiKey) {
        return new Response("Unauthorized - Authorization header is required", {
          status: 401,
        });
      }
      apiKey = apiKey.replace("Bearer ", "");

      // Verify the token.
      let token: any;
      try {
        token = await verifySync(apiKey);
        console.log("verified", token);
      } catch (error) {
        return new Response("Unauthorized - The token may have expired", {
          status: 401,
        });
      }

      // Decode the token. NOTE: "Bearer " is optional.
      const { sub } = JWTSchema.parse(token);
      if (!sub) {
        return new Response("Unauthorized - Invalid token", { status: 401 });
      }

      // Verify that the API key is valid.
      const _allUserAPIKeys = await env.fntu_api_kv.get(`api-keys-${sub}`);
      if (!_allUserAPIKeys) {
        return new Response("Unauthorized - API Key may not exist / expired", {
          status: 401,
        });
      }

      const allUserAPIKeys = JSON.parse(_allUserAPIKeys);
      const apiKeysResult = KVAPIKeysSchema.safeParse(allUserAPIKeys);
      if (!apiKeysResult.success) {
        return new Response("Unauthorized - Something went wrong", {
          status: 401,
        });
      }

      if (!apiKeysResult.data.includes(apiKey)) {
        return new Response("Unauthorized - Invalid token", { status: 401 });
      }

      const { success } = await env.SIMPLE_RATE_LIMITER.limit({
        key: pathname,
      }); // key can be any string of your choosing
      if (!success) {
        return new Response(
          `429 Failure - rate limit exceeded for ${pathname}`,
          {
            status: 429,
          }
        );
      }
    }

    if (pathname === "/") {
      // Serve ui.html for root path
      const uiRequest = new Request(new URL("/ui.html", request.url), request);
      return env.ASSETS.fetch(uiRequest);
    }

    if (pathname.startsWith("/ui")) {
      return env.ASSETS.fetch(request);
    }

    return app.fetch(request, env);
  },
};
