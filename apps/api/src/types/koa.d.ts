import type { Knex } from "knex";
import "koa";
import type { Context } from "koa";

declare module "koa" {
  interface DefaultContext {
    db: Knex;
    user?: {
      id: string;
      email: string;
    };
    isLoggedIn: boolean;
  }
}

export type TypedContext<T extends Record<string, string>> = Omit<
  Context,
  "params"
> & {
  params: T;
};
