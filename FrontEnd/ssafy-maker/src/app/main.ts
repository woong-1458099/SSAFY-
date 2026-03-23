import { createGame } from "./game";
import { assertAppEnv } from "./config/env";
import { initializeAuthGateway } from "../features/auth/AuthGateway";

async function bootstrapApplication(): Promise<void> {
  assertAppEnv();
  const authBootstrap = await initializeAuthGateway();
  createGame(authBootstrap);
}

void bootstrapApplication();
