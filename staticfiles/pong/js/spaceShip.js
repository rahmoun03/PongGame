window.spaceShip = function () {
    const canvas = document.getElementById("spaceship");

    console.log(canvas);

    const fbxLoader = new THREE.FBXLoader();

    const scene = new THREE.Scene();

    let width = window.innerWidth * 0.8;
    let height = window.innerHeight * 0.8;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer( {canvas: canvas, antialias: true} );

    renderer.setSize(width, height);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 6);

    const directionalLight = new THREE.DirectionalLight(0x00aaff, 1, 10);

    directionalLight.position.set(0, 20, 10);

    scene.add(light);

    camera.position.set(4, 0.4, 10);

    let blackHole = new THREE.Object3D();

    let Particles;

    fbxLoader.load('static/pong/assets/planets/black-hole/source/blackhole.fbx', function (gltf) {
        blackHole.add(gltf);
        blackHole.scale.set(0.0001, 0.0001, 0.0001);

        console.log("black hole", blackHole);
        scene.add(blackHole);

    });



    function createParticls() {
        const count = 50000;
        let positions = new Float32Array(count * 3);
        let colors = new Float32Array(count * 3);

        for (let index = 0; index < count * 3; index++) {
            positions[index] = (Math.random() - 0.5) * 100;
            colors[index] = Math.random();
        }

        const ParticleGeometry = new THREE.BufferGeometry();
        ParticleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        ParticleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const ParticlesMaterial = new THREE.PointsMaterial({
                size: 0.3,
                sizeAttenuation: true,
                vertexColors: true,
                transparent: true,
                depthWrite: false,
                // blending: THREE.additiveBlending,
                alphaMap : new THREE.TextureLoader().load('static/pong/assets/kenney_particle-pack/PNG (Transparent)/star_06.png'),
            });

        Particles = new THREE.Points(
            ParticleGeometry,
            ParticlesMaterial
        )
        Particles.rotation.x = Math.PI / 2;
        scene.add(Particles);
    }

    function onWindowResize() {
        width = window.innerWidth * 0.8;
        height = window.innerHeight * 0.8;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    window.addEventListener('resize', onWindowResize);

    function animateParticles() {
        if (Particles) {
            Particles.rotation.z += 0.001;
        }
    }


    const animate = function () {
        requestAnimationFrame(animate);

        blackHole.rotation.y += 0.0005;
        animateParticles();
        controls.update();
        renderer.render(scene, camera);
    };
    createParticls();
    animate();
}

window.spaceShip();
