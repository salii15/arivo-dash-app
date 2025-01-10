import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
        <script src="https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"></script>
        <script src="https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.initThreeJSControls = () => {
              window.OrbitControls = THREE.OrbitControls;
              window.GLTFLoader = THREE.GLTFLoader;
            }
          `
        }} />
        <script src="/three-viewer.js"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 