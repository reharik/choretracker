import Router from '@koa/router';
import { RESOLVER } from 'awilix';
import type { Container } from '../container';

export interface Routes {
  mountRoutes: (router: Router) => void;
}

export const createRoutes = ({ authRoutes, choreRoutes }: Container): Routes => ({
  mountRoutes: (router: Router) => {
    router.use(authRoutes.routes());
    router.use(authRoutes.allowedMethods());
    choreRoutes.mountRoutes(router);
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createRoutes as any)[RESOLVER] = {};
