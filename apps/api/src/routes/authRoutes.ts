import Router from "@koa/router";
import { RESOLVER } from "awilix";
import type { Container } from "../container";
import { requireAuth } from "../middleware/routeGuards";

export const createAuthRoutes = ({ authController }: Container): Router => {
  const router = new Router({ prefix: "/auth" });

  // Public routes
  router.post("/login", authController.login);
  router.post("/signup", authController.signup);
  router.post("/logout", authController.logout);

  // Protected routes
  router.get("/me", requireAuth(), authController.me);

  return router;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createAuthRoutes as any)[RESOLVER] = {};
