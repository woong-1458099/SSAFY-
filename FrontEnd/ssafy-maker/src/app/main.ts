import { createGame } from "./game";
import { initializeAuthGateway } from "../features/auth/AuthGateway";

async function bootstrapApplication(): Promise<void> {
  const authBootstrap = await initializeAuthGateway();
  createGame(authBootstrap);
}

void bootstrapApplication();
