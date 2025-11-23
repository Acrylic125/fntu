import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  // h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
  // h2: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
  // h3: ({ children }) => <h3 className="text-lg font-bold">{children}</h3>,
  // h4: ({ children }) => <h4 className="text-base font-bold">{children}</h4>,
  // h5: ({ children }) => <h5 className="text-sm font-bold">{children}</h5>,
  // p: ({ children }) => <p className="text-base">{children}</p>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
