import 'koa';
import type { Knex } from 'knex';

declare module 'koa' {
  interface DefaultContext {
    db: Knex;
    user?: {
      id: string;
      email: string;
    };
    isLoggedIn: boolean;
  }
}

export type TypedContext<T extends Record<string, string>> = Context & {
  params: T;
};
