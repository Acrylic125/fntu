import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { app } from "./app";
import { nanoid } from "nanoid";
import { createDecoder, createSigner, createVerifier } from "fast-jwt";
import z from "zod";
import { Hono } from "hono";

export interface Env {
  SIMPLE_RATE_LIMITER: RateLimit;
  ASSETS: Fetcher;
  fntu_api_kv: KVNamespace;

  // Vars
  DATABASE_URL: string;
  CLERK_SECRET_KEY: string;
}

const JWTSchema = z.object({
  sub: z.string(),
  exp: z.number(),
});

const KVAPIKeysSchema = z.array(z.string());

// Using HS256 by default.
const signSync = createSigner({ key: async () => "secret", expiresIn: "30d" });
const verifySync = createVerifier({ key: async () => "secret" });
const decodeSync = createDecoder();

const tokensRoutes = new Hono().use("*", clerkMiddleware());

tokensRoutes.post("/", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({
      message: "You are not logged in.",
    });
  }
  const userId = auth.userId;
  const { fntu_api_kv } = c.env as Env;
  // const userId = "123";
  const token = await signSync({
    sub: userId,
  });
  const currentTokensRaw = await fntu_api_kv.get(`api-keys-${userId}`);
  let newTokens: string[] = [];
  if (currentTokensRaw) {
    const currentTokensArray = JSON.parse(currentTokensRaw);
    const kvAPITokensResult = KVAPIKeysSchema.safeParse(currentTokensArray);
    if (!kvAPITokensResult.success) {
      return c.json(
        {
          message: "Something went wrong.",
        },
        500
      );
    }
    const kvAPITokens = kvAPITokensResult.data;
    if (kvAPITokens.includes(token)) {
      return c.json(
        {
          message: "Something went wrong.",
        },
        500
      );
    }
    newTokens = kvAPITokens;
  }

  if (newTokens.length >= 3) {
    return c.json(
      {
        message:
          "You have reached the max number of API keys allowed (3). Please delete any key.",
      },
      400
    );
  }

  newTokens.push(token);

  await fntu_api_kv.put(`api-keys-${userId}`, JSON.stringify(newTokens), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 days
  });

  const decodedTokens = newTokens.map((token) => {
    return {
      token,
      ...JWTSchema.parse(decodeSync(token)),
    };
  });

  return c.json(
    {
      message: "API key created successfully.",
      token,
      tokens: decodedTokens,
    },
    201
  );
});

tokensRoutes.get("/", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401
    );
  }
  const { fntu_api_kv } = c.env as Env;
  const userId = auth.userId;
  const currentTokensRaw = await fntu_api_kv.get(`api-keys-${userId}`);
  if (!currentTokensRaw) {
    return c.json(
      {
        tokens: [],
      },
      200
    );
  }
  const currentTokens = JSON.parse(currentTokensRaw);
  const parsedTokens = KVAPIKeysSchema.safeParse(currentTokens);
  if (!parsedTokens.success) {
    return c.json(
      {
        tokens: [],
      },
      500
    );
  }
  const tokens = parsedTokens.data;
  const decodedTokens = tokens.map((token: string) => {
    return {
      token,
      ...JWTSchema.parse(decodeSync(token)),
    };
  });
  return c.json({ tokens: decodedTokens }, 200);
});

tokensRoutes.delete("/:token", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401
    );
  }
  const token = c.req.param("token");
  const { fntu_api_kv } = c.env as Env;
  const userId = auth.userId;
  const currentTokensRaw = await fntu_api_kv.get(`api-keys-${userId}`);
  if (!currentTokensRaw) {
    return c.json(
      {
        message: "No API keys found.",
      },
      404
    );
  }
  const currentTokens = JSON.parse(currentTokensRaw);
  const parsedTokens = KVAPIKeysSchema.safeParse(currentTokens);
  if (!parsedTokens.success) {
    return c.json(
      {
        message: "Something went wrong.",
      },
      500
    );
  }
  const tokens = parsedTokens.data;
  if (!tokens.includes(token)) {
    return c.json(
      {
        message: "Token not found.",
      },
      404
    );
  }
  const newTokens = tokens.filter((t: string) => t !== token);
  await fntu_api_kv.put(`api-keys-${userId}`, JSON.stringify(newTokens), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 days
  });
  return c.json(
    {
      message: "API key deleted successfully.",
      token,
      tokens: newTokens.map((t: string) => {
        return {
          token: t,
          ...JWTSchema.parse(decodeSync(t)),
        };
      }),
    },
    200
  );
});

app.route("/tokens", tokensRoutes);

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
        key: sub,
      }); // key can be any string of your choosing
      if (!success) {
        return new Response(`429 Failure - rate limit exceeded for ${sub}`, {
          status: 429,
        });
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
