import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <script type="importmap">
          {JSON.stringify({
            imports: {
              "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
              "three/examples/jsm/controls/OrbitControls": "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js",
              "three/examples/jsm/loaders/GLTFLoader": "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
              "three/examples/jsm/loaders/RGBELoader": "https://unpkg.com/three@0.160.0/examples/jsm/loaders/RGBELoader.js"
            }
          })}
        </script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 