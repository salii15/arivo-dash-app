// Check if ThreeViewer is already defined
if (typeof window.ThreeViewer === 'undefined') {
    window.ThreeViewer = class ThreeViewer {
        constructor(containerId) {
            return (async () => {
                this.container = document.getElementById(containerId);
                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
                this.renderer = new THREE.WebGLRenderer({ antialias: true });
                this.controls = null;
                this.model = null;

                this.init();
                return this;
            })();
        }

        init() {
            // Scene setup
            this.scene.background = new THREE.Color(0x1a1a1a);

            // Renderer setup
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.container.appendChild(this.renderer.domElement);

            // Camera setup
            this.camera.position.z = 5;

            // Controls
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            this.scene.add(directionalLight);

            // Start animation
            this.animate();

            // Handle resize
            window.addEventListener('resize', () => this.onWindowResize(), false);
        }
        loadModel(url) {
            const loader = new GLTFLoader();
            
            // URL bir File objesi ise, URL.createObjectURL kullan
            const modelUrl = url instanceof File ? URL.createObjectURL(url) : url;
            
            loader.load(modelUrl, (gltf) => {
                if (this.model) {
                    this.scene.remove(this.model);
                }
                this.model = gltf.scene;
                this.scene.add(this.model);

                // Center and scale model
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                this.model.scale.setScalar(scale);
                this.model.position.sub(center.multiplyScalar(scale));

                // URL.createObjectURL kullanıldıysa, belleği temizle
                if (url instanceof File) {
                    URL.revokeObjectURL(modelUrl);
                }
            }, 
            // Progress callback
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // Error callback
            (error) => {
                console.error('Model yüklenirken hata oluştu:', error);
            });
        }
        onWindowResize() {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }

        dispose() {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }
}