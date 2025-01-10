import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Load Three.js scripts
    const loadScripts = async () => {
      const script = document.createElement('script');
      script.src = '/three-viewer.js';
      script.async = true;
      document.body.appendChild(script);
    };

    loadScripts();
  }, []);

  return <Component {...pageProps} />
}
