import { describeRoute } from "hono-openapi";

type DescribeRouteParam1 = Parameters<typeof describeRoute>[0];
type ParametersObject = DescribeRouteParam1["parameters"];

export const API_PARAMS: ParametersObject = [
  {
    name: "Authorization",
    in: "header",
    required: true,
    description:
      "The API key to use for the request. Please sign in and register for an API key.",
    schema: {
      type: "string",
    },
  },
];
