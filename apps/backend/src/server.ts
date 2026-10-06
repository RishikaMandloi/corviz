import app from "./app";
import { env } from "./config";
import { connectDatabase } from "./database";
import { topicRepository } from "./modules/topic/topic.repository";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await topicRepository.seedVerifiedCatalog();

    app.listen(env.PORT, () => {
      console.log(
        `🚀 Server is running on http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exit(1);
  }
};

startServer();