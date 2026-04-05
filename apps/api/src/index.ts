export { RaceRoom } from "./infrastructure/durableObject/RaceRoom";

import { createApiApp } from "./app";

const app = createApiApp();
export default app;
export type { AppType } from "./app";
