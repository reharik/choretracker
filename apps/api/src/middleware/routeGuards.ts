import type { Context } from "koa";

/**
 * Route guard that ensures the user is authenticated
 * Returns 401 if not logged in, otherwise calls the controller
 */
export const requireAuth = (
  controller?: (ctx: Context) => Promise<Context>,
) => {
  if (controller) {
    // Used as a wrapper for controller functions
    return async (ctx: Context) => {
      if (!ctx.isLoggedIn) {
        ctx.status = 401;
        ctx.body = { error: "Authentication required" };
        return;
      }

      await controller(ctx);
    };
  }

  // Used as middleware
  return async (ctx: Context, next: () => Promise<void>) => {
    if (!ctx.isLoggedIn) {
      ctx.status = 401;
      ctx.body = { error: "Authentication required" };
      return;
    }

    await next();
  };
};

/**
 * Route guard that allows both authenticated and unauthenticated users
 * Useful for routes that behave differently based on auth status
 */
export const optionalAuth = (
  controller: (ctx: Context) => Promise<Context>,
) => {
  return async (ctx: Context) => {
    await controller(ctx);
  };
};
