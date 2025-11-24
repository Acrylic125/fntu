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
        description:
          '## Overview\n \nThis is the API reference for the FNTU API Playground. To try it out, generate an API key from the [API Keys](https://fntu.benapps.dev/dashboard/api-keys) page, and paste it in the `Authorization` field.\n \nYou might need to scroll down a bit to see the input fields.\n \n## Pagination\nSome routes support pagination. Generally, you pass in a limit and a cursor to paginate. The "next cursor" will be provided in the response.\n \n## Rate Limits\n \nAll users have a rate limit of 10 requests per minute. If you exceed the rate limit, you will receive a 429 status code. Consider [Self Hosting the API](https://fntu.benapps.dev/docs/hosting)..',
      },
    },
  })
);
