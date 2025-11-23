import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { cors } from "hono/cors";
import { programsRoute } from "./routes/programs";
import { locationsRoute } from "./routes/locations";
import { coursesRoute } from "./routes/course";

export const app = new Hono();

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
    },
  })
);
