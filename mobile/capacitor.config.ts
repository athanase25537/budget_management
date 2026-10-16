import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.kajyvola.app',
  appName: 'Kajy Vola',
  webDir: 'www/browser',
  server: { androidScheme: 'https' },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
