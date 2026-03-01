/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:container` after adding/removing services.
*/
type KoaServer = import("../koaServer").KoaServer;

type AuthService = import("../services/authService").AuthService;

type ChoreRepository =
  import("../repositories/choreRepository").ChoreRepository;

type AuthController = import("../controllers/authController").AuthController;

type ChoreController = import("../controllers/choreController").ChoreController;

type AuthMiddleware = import("../middleware/authMiddleware").AuthMiddleware;

type OptionalAuthMiddleware =
  import("../middleware/authMiddleware").OptionalAuthMiddleware;

type ErrorHandlerType =
  (typeof import("../middleware/errorHandler"))["createErrorHandler"];
type ErrorHandler = ErrorHandlerType extends new (...args: unknown[]) => infer I
  ? I
  : ErrorHandlerType extends (...args: unknown[]) => infer R
    ? R
    : ErrorHandlerType extends { (...args: unknown[]): infer C }
      ? C
      : unknown;

type RequestLoggerType =
  (typeof import("../middleware/requestLogger"))["createRequestLogger"];
type RequestLogger = RequestLoggerType extends new (
  ...args: unknown[]
) => infer I
  ? I
  : RequestLoggerType extends (...args: unknown[]) => infer R
    ? R
    : RequestLoggerType extends { (...args: unknown[]): infer C }
      ? C
      : unknown;

type AuthRoutesType =
  (typeof import("../routes/authRoutes"))["createAuthRoutes"];
type AuthRoutes = AuthRoutesType extends new (...args: unknown[]) => infer I
  ? I
  : AuthRoutesType extends (...args: unknown[]) => infer R
    ? R
    : AuthRoutesType extends { (...args: unknown[]): infer C }
      ? C
      : unknown;

type ChoreRoutes = import("../routes/choreRoutes").ChoreRoutes;

type Routes = import("../routes/createRoutes").Routes;

export interface AutoLoadedContainer {
  koaServer: KoaServer;
  authService: AuthService;
  choreRepository: ChoreRepository;
  authController: AuthController;
  choreController: ChoreController;
  authMiddleware: AuthMiddleware;
  optionalAuthMiddleware: OptionalAuthMiddleware;
  errorHandler: ErrorHandler;
  requestLogger: RequestLogger;
  authRoutes: AuthRoutes;
  choreRoutes: ChoreRoutes;
  routes: Routes;
}
