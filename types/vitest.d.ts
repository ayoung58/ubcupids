import "vitest";

declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toBeDisabled(): T;
    toHaveClass(className: string): T;
  }
}
