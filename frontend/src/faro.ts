// src/faro.ts
import { initializeFaro, getWebInstrumentations, type Faro } from '@grafana/faro-web-sdk';

const faroUrl = import.meta.env.VITE_FARO_URL;

export const faro: Faro | null = faroUrl
  ? initializeFaro({
      url: faroUrl,
      app: {
        name: 'license-plate-frontend',
        version: '1.0.0',
        environment: import.meta.env.VITE_ENVIRONMENT || 'development',
      },
      instrumentations: [
        ...getWebInstrumentations({
          captureConsole: true,
        }),
      ],
    })
  : null;
