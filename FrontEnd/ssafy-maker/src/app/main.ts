import { createGame } from "./game";
import { initializeAuthGateway } from "../features/auth/AuthGateway";
import { initializeAnalytics, setAnalyticsUserId } from "@shared/lib/analytics";

async function bootstrapApplication(): Promise<void> {
  const authBootstrap = await initializeAuthGateway();
  initializeAnalytics();
  setAnalyticsUserId(authBootstrap.session?.user.id);
  createGame(authBootstrap);
}

void bootstrapApplication();
