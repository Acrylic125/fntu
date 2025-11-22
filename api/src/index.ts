import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { cors } from "hono/cors";
import { programsRoute } from "./routes/programs";
import { locationsRoute } from "./routes/locations";
import { coursesRoute } from "./routes/course";

export interface Env {
  SIMPLE_RATE_LIMITER: any;
  ASSETS: any;
  DATABASE_URL: string;
}

const app = new Hono();

// TODO: Change to use whatever auth provider you use.
// app.use("*", clerkMiddleware());

app.use("*", cors());

const apiRoute = new Hono();
apiRoute.route("/programs", programsRoute);
apiRoute.route("/locations", locationsRoute);
apiRoute.route("/courses", coursesRoute);
app.route("/api", apiRoute);

app.get(
  "/openapi.json",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "FNTU API",
        version: "1.0.0",
        description: "API Reference.",
      },
      // servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  })
);

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);

    // Only apply rate limiting to API routes.
    if (pathname.startsWith("/api2/")) {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return new Response("Unauthorized", { status: 401 });
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

    if (pathname.startsWith("/ui")) {
      return env.ASSETS.fetch(request);
    }

    return app.fetch(request, env);
  },
};
