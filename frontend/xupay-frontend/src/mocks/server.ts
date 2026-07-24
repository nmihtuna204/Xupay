import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Node/vitest MSW server. Individual tests append real-API-domain handlers
// via server.use(...) for the endpoints they exercise.
export const server = setupServer(...handlers);
