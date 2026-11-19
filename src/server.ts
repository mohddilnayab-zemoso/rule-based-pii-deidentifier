import { createApp } from './app';
import { config } from './config'; 

const app = createApp();

app.listen(config.port, () => {
  console.log(`[${config.nodeEnv}] De-identification service running on http://localhost:${config.port}`);
});