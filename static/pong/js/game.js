window.play = function ()
{
    const canvas = document.getElementById("Mycanvas");

    const gui = new dat.GUI();

    const loader = new THREE.GLTFLoader();

    const scene = new THREE.Scene();

    let width = window.innerWidth * 0.8;
    let height = window.innerHeight * 0.8;

    const axesHelper = new THREE.AxesHelper(width / 2);

    let helperBox, playerColletion;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer( {canvas, antialias: true} );

    const FontLoader = new THREE.FontLoader();

    let controls;

    const background = new THREE.Object3D();
    const randomCollection = new THREE.Object3D();

    let startGame = 0;

    let player1, boot;
    let player1BB, bootBB;
    let playerOldX, playerWidth, playerSpeed, playerPoints, playerScoreMesh, AIbootScoreMesh, bootPoints;
    playerPoints = 0;
    bootPoints = 0;
    playerSpeed = 0.3;
    playerWidth = 3;
    const paddleSize = new THREE.Vector3(3, 1, 0.5);

    const TableG = new THREE.Group();

    const tableHeight = 45;
    const tableWidth = 28;

    const Mode3D = 0;
    const MoveCamera = 1; 

    let oldBall, newBall;


    let clips, mixer, grid, plane, tableCenter, boundM, boundY, idleAction;

    let WallL, WallR, WallL1, WallR1;
    let WallLBB, WallRBB, WallL1BB, WallR1BB;
    let rectLight1, rectLight2, rectLight3, rectLight4;

    let ball = new THREE.Object3D();
    let ballBB, directionalLight, Spotlight1, Spotlight2;
    let radius, speed, start, elapsedTime, checkpoint;
    radius = tableHeight / 2;
    speed = 0.2;
    let bootSpeed = speed / 4;
    checkpoint = 0;
    start = new THREE.Vector2(0.0, 0.0);
    elapsedTime = 0;

    const keys = {
        a: false, 
        d: false,
        l: false,
        k: false,
        ArrowLeft: false, 
        ArrowRight: false,
        1: false,
        2: false,
        Enter: false
    };

    const stats = new Stats();
    // Audio loader
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // Load sound effects
    const endSound = new THREE.Audio(listener);
    const boundaryHitSound = new THREE.Audio(listener);
    const backgroundMusic = new THREE.Audio(listener);
    const scoreSound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();














    socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.table('data', data)
        if (data.type === "start") {
            // Hide the waiting canvas.widthpage and start the game
            waitingPage.style.display = "none";
            canvas.style.display = "block";
            document.getElementById("canvasSpace").style.display = "flex";
            player = data.player1;
            player2 = data.player2;
            ball = data.ball;
            score = data.score;
            paddle = data.paddle
            startCountdown(() => {
                loop(); // Start the game loop after the countdown
                socket.send(JSON.stringify({ 
                    type: "start_game",
                }));
            });
        }
        if (data.type === "update") {
            ball = data.ball;
            player = data.player1;
            player2 = data.player2;
            score = data.score;
        }
        if (data.type === "game_over") {
            score = data.score;
            draw();
            endGame(data.winner);
        }
    };
    socket.onclose = () => {
        wsOpen = false;
        console.log("WebSocket closed!");
    };
    // Send paddle event to server
    function sendPaddlePosition() {
        console.log("sending  data ...");
        socket.send(JSON.stringify({
            type: "update_paddle",
            direction : playerDirection,
            mode: selectedMode,
        }));
    }


















    // Load paddle hit sound
    audioLoader.load('sound/what-a-fuck-120320.mp3', function(buffer) {
      endSound.setBuffer(buffer);
      endSound.setVolume(0.5);  // Adjust volume
    });

    // Load boundary hit sound
    audioLoader.load('sound/retro-select-236670.mp3', function(buffer) {
        boundaryHitSound.setBuffer(buffer);
        boundaryHitSound.setVolume(0.5);
    });


    audioLoader.load('sound/535890__jerimee__coin-jump.wav', function(buffer) {
        scoreSound.setBuffer(buffer);
        scoreSound.setVolume(0.81);
    });

    // Load background music
    audioLoader.load('sound/015962_retrom4a-56143.mp3', function(buffer) {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true);  // Loop background music
        backgroundMusic.setVolume(0.1);
        backgroundMusic.play();  // Start playing the music
    });
    
    // Listen for a user gesture to start audio
    window.addEventListener('click', startAudioContext);

    // Event listeners for keydown and keyup events
    document.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            if(event.key == "ArrowLeft" || event.key == "ArrowRight"
                || event.key == "a" || event.key == "d")
                keys[event.key] = true;
            else
            {
                if (keys[event.key] == true) keys[event.key] = false;
                else keys[event.key] = true;
            }
        }
        // console.log("key down: ", event);
    });
        
    document.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            if(event.key == "ArrowLeft" || event.key == "ArrowRight"
                || event.key == "a" || event.key == "d")
                keys[event.key] = false;
        }
    });


    window.addEventListener("resize", () => {
        width = window.innerWidth * 0.8;
        height = window.innerHeight * 0.8;
        camera.aspect = width / height;
        renderer.setSize(width , height);
        camera.updateProjectionMatrix();
    });

    init();
    table();
    createObjects();
    ballCreation();
    playerCreation();
    createScore();
    createBox();
    // addCollections();
    // initBB();
    lights();
    guiControl();
    animate();



    function startAudioContext() {
        const audioContext = listener.context;
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
            console.log('Audio context resumed');
            // backgroundMusic.play(); // Start the background music after resuming
        });
        }
    }
 
    function init() {
                
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        grid = new THREE.GridHelper( 1000, 1000, 0x00ff00, 0x00ff00 );
        grid.material.opacity = 1;
        grid.material.transparent = true;
        grid.position.y = 0;
                // scene.add( grid );
                
        // scene.add( helper );
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        document.body.appendChild( stats.dom );
        
        camera.position.set(20, 70, 50);

        scene.add(camera);
    }

    function animate ()
    {
        window.requestAnimationFrame(animate);
        controls.update();
        stats.update();
        renderer.render( scene, camera );
        
        if (playerPoints < 5 && bootPoints < 5)
        {
            
            // clock = new THREE.Clock();
            if(!startGame && start.x < 1)
            {
                camera.position.lerpVectors(new THREE.Vector3(20, 70, 50), new THREE.Vector3(0, 15, 33), start.x);
                start.x += 0.01;
                if(start.x >= 1)
                {
                    startGame = 1;
                }
            }
            else if(startGame)
            {
                elapsedTime = clock.getElapsedTime();
                updateCamera();
                // console.log((1 / 2000) * 16.67);
                // ballDetection();
                // player1BB.copy(player1.geometry.boundingBox).applyMatrix4(player1.matrixWorld);
                // bootBB.copy(boot.geometry.boundingBox).applyMatrix4(boot.matrixWorld);
                // ballBB.copy(ball.geometry.boundingBox).applyMatrix4(ball.matrixWorld);
                
                if(velocity.z < 0.7 && velocity.z > -0.7 && ((elapsedTime | 0) > 10))
                {
                    console.log("Time : ", elapsedTime | 0);
                    clock = new THREE.Clock();
                    (velocity.z > 0 ? velocity.z += 0.1 : velocity.z -= 0.1);
                    console.log("speed up : ", velocity.z);
                }
                ball.position.add(velocity);
                ballDetection();
                ballOut();
                


                // player 1
                if((keys.ArrowLeft) && ((player1.position.x - (paddleSize.x / 2)) > -(tableWidth / 2) + 1)) player1.position.x -= playerSpeed;
                else if((keys.ArrowRight) && ((player1.position.x + (paddleSize.x / 2)) < (tableWidth / 2) - 1)) player1.position.x += playerSpeed;
                Spotlight1.position.copy(player1.position);
                playerColletion.position.copy(player1.position);

                if(keys["1"] && Spotlight1.visible == false) Spotlight1.visible = true;
                else if(keys["1"] == false && Spotlight1.visible == true) Spotlight1.visible = false;
                
                // player 2
                boot.position.x = THREE.MathUtils.lerp(boot.position.x, ball.position.x, bootSpeed);
                Spotlight2.position.copy(boot.position);

                if(keys["l"] && Spotlight2.visible == false) Spotlight2.visible = true;
                else if(keys["l"] == false && Spotlight2.visible == true) Spotlight2.visible = false;
            }
            if(playerPoints == 5)
            {
                endSound.play();
                window.alert("Player Wins");
            }
            else if(bootPoints == 5)
            {
                endSound.play();
                window.alert("Boot Wins");
            }
        }
    }

    function table() {
        
        plane = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, tableHeight),
            new THREE.MeshPhysicalMaterial( {
                // color: 0xbcbcbc,
                side: THREE.DoubleSide,
                reflectivity: 0,
                transmission: 1.0,
                roughness: 0.2,
                metalness: 0,
                clearcoat: 0.3,
                clearcoatRoughness: 0.25,
                color: new THREE.Color(0xffffff),
                ior: 1.2
                // thickness: 10.0
            } )
        );
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(0, -0.49, 0);
        TableG.add(plane);
    //////////////////////////////////////////////////
        tableCenter = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, 0.2),
            new THREE.MeshBasicMaterial({color: "white"})
        );
        tableCenter.receiveShadow = true;
        tableCenter.rotation.x = -Math.PI / 2;
        tableCenter.position.set(0, plane.position.y + 0.01, 0);
        TableG.add(tableCenter);
    /////////////////////////////////////////////////
        boundM = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, 0.1),
            new THREE.MeshBasicMaterial({color: "white"})
        );
        boundM.receiveShadow = true;
        boundM.rotation.x = -Math.PI / 2;
        boundM.position.set(0, plane.position.y + 0.01, tableHeight / 2);
        TableG.add(boundM);
    ///////////////////////////////////////////////////////
        boundY = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, 0.1),
            new THREE.MeshBasicMaterial({color: "white"})
        );
        boundY.receiveShadow = true;
        boundY.rotation.x = -Math.PI / 2;
        boundY.position.set(0, plane.position.y + 0.01, -(tableHeight / 2));
        TableG.add(boundY);

    /////////////////////////////////////////////
        WallL = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: "cyan",
                emissive: "cyan", // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        WallL.position.set(-(tableWidth / 2) + 0.5, 0, tableHeight / 4);
        TableG.add(WallL);
        
        rectLight1 = new THREE.RectAreaLight( "cyan", 2, tableHeight / 2, 3 );
        rectLight1.position.set( WallL.position.x + 0.5, WallL.position.y , WallL.position.z);
        rectLight1.rotation.y = -Math.PI / 2;
        TableG.add( rectLight1 );
    /////////////////////////////////////////////
        WallL1 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00, // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
                })
        );
        WallL1.position.set(-(tableWidth / 2) + 0.5, 0, -(tableHeight / 4));
        TableG.add(WallL1);

        rectLight2 = new THREE.RectAreaLight( 0x00ff00, 2, tableHeight / 2, 3 );
        rectLight2.position.set( WallL1.position.x + 0.5, WallL1.position.y, WallL1.position.z);
        rectLight2.rotation.y = -Math.PI / 2;
        TableG.add( rectLight2 );
    ///////////////////////////////////////////////
        WallR = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00, // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        WallR.position.set(tableWidth / 2 - 0.5, 0, tableHeight / 4);
        TableG.add(WallR);

        rectLight3 = new THREE.RectAreaLight( 0x00ff00, 2, tableHeight / 2, 3 );
        rectLight3.position.set( WallR.position.x - 0.5, WallR.position.y, WallR.position.z);
        rectLight3.rotation.y = Math.PI / 2;
        TableG.add( rectLight3 );
    ///////////////////////////////////////////////////
        WallR1 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: "cyan",
                emissive: "cyan", // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        WallR1.position.set(tableWidth / 2 - 0.5, 0, -(tableHeight / 4));
        TableG.add(WallR1);

        rectLight4 = new THREE.RectAreaLight( "cyan", 2, tableHeight / 2, 3 );
        rectLight4.position.set( WallR1.position.x - 0.5, WallR1.position.y, WallR1.position.z);
        rectLight4.rotation.y = Math.PI / 2;
        TableG.add( rectLight4 );
    //////////////////////////////////////////////////////
        scene.add(TableG);
    }

    function ballCreation() {
        // loader.load('./assets/ball/fireballvfx.fbx', (gltf) => {
        //     ball.add(gltf.scene);
        // });
        ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshToonMaterial( { 
                color: "orange",
                emissive: "orange", // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        ball.position.set(0, 0.1, 0);
        scene.add(ball);
    }

    function guiControl(){
        gui.add(camera.position, "x",);
        gui.add(camera.position, "y");  
        gui.add(camera.position, "z");
        gui.add(plane, "visible").name("plane");
        gui.add(directionalLight, "visible").name("directional Light");
        gui.add(grid, "visible").name("grid");
        gui.add(axesHelper, "visible").name("helper");
        gui.close();
    }

    function lights()
    {
        directionalLight = new THREE.DirectionalLight(0xfdfbd3, 1);
        directionalLight.position.set(0, 10, 0);
        directionalLight.castShadow = true;
    }

    function playerCreation() {
        player1 = new THREE.Mesh(
            new THREE.BoxGeometry(paddleSize.x, paddleSize.y, paddleSize.z),
            new THREE.MeshToonMaterial({
                color: "cyan",
                emissive: "cyan",
                emissiveIntensity: 1.0
            })
        );
        player1.position.set(0, 0, (tableHeight / 2) - (paddleSize.z / 2));
        playerOldX = player1.position.x;
        scene.add(player1);

        Spotlight1 = new THREE.SpotLight();
        Spotlight1.angle = Math.PI / 3;
        Spotlight1.shadow.mapSize.width = 512;
        Spotlight1.shadow.mapSize.height = 512;
        Spotlight1.shadow.camera.near = 2.0;
        Spotlight1.shadow.camera.far = 45;
        Spotlight1.penumbra = 0.5;
        Spotlight1.castShadow = true;
        Spotlight1.visible = false;
        scene.add(Spotlight1);

        boot = new THREE.Mesh(
            new THREE.BoxGeometry(paddleSize.x, paddleSize.y, paddleSize.z),
            new THREE.MeshToonMaterial({
                color: "red",
                emissive: "red",
                emissiveIntensity: 1.0
            })
        );
        boot.position.set(0, 0, -(tableHeight / 2) + (paddleSize.z / 2));
        scene.add(boot);

        Spotlight2 = new THREE.SpotLight();
        Spotlight2.angle = Math.PI / 3;
        Spotlight2.shadow.mapSize.width = 512;
        Spotlight2.shadow.mapSize.height = 512;
        Spotlight2.shadow.camera.near = 2.0;
        Spotlight2.shadow.camera.far = 45;
        Spotlight2.penumbra = 0.5;
        Spotlight2.castShadow = true;
        Spotlight2.visible = false;
        scene.add(Spotlight2);
    }

    function createObjects()
    {
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
                size: 0.2,
                sizeAttenuation: true,
                vertexColors: true,
                transparent: true,
                depthWrite: false,
                alphaMap : new THREE.TextureLoader().load('./assets/kenney_particle-pack/PNG (Transparent)/star_06.png'),
            });

        const Particles = new THREE.Points(
            ParticleGeometry,
            ParticlesMaterial
        );
        Particles.rotation.x = Math.PI / 2;
        scene.add(Particles);
    }

    function createBB(target) {
        const BB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        BB.setFromObject(target);
        return BB;
    }

    function initBB() {
        player1BB = createBB(player1);
        helperBox = new THREE.Box3Helper( player1BB, 0xffff00 );
        bootBB = createBB(boot);
        
        ballBB = new THREE.Sphere(ball.position, 0.5);
        
        WallLBB = createBB(WallL);
        WallRBB = createBB(WallR);
        WallL1BB = createBB(WallL1);
        WallR1BB = createBB(WallR1);
    }

    function updateCamera() {
        if(Mode3D && MoveCamera)
            camera.position.x = player1.position.x / 4;
    }

    function ballDetection() {
        
        if (ball.position.z <= player1.position.z && ball.position.z >= player1.position.z - (speed + paddleSize.z)
            && ((ball.position.x <= (player1.position.x + (paddleSize.x / 1.65))
            && ball.position.x >= (player1.position.x + (paddleSize.x / 1.45)))
            || (ball.position.x <= (player1.position.x - (paddleSize.x / 1.65))
            && ball.position.x >= (player1.position.x - (paddleSize.x / 1.45))))) {
                    boundaryHitSound.play();
                    velocity.x = -velocity.x; // Reverse the X direction
            
        }

        if (ball.position.z <= boot.position.z && ball.position.z >= boot.position.z - (speed + paddleSize.z)
            && ((ball.position.x <= (boot.position.x + (paddleSize.x / 1.65))
            && ball.position.x >= (boot.position.x + (paddleSize.x / 1.45)))
            || (ball.position.x <= (boot.position.x - (paddleSize.x / 1.65))
            && ball.position.x >= (boot.position.x - (paddleSize.x / 1.45))))) {
                    boundaryHitSound.play();
                    velocity.x = -velocity.x; // Reverse the X direction
            
        }

        if (ball.position.z <= player1.position.z && ball.position.z >= player1.position.z - (speed + paddleSize.z)
            && ball.position.x <= (player1.position.x + (paddleSize.x / 1.5))
            && ball.position.x >= (player1.position.x - (paddleSize.x / 1.5))) {
                boundaryHitSound.play();
                // console.log("ball Z ", ball.position.z , "Player Z "  , player1.position.z - (paddleSize.z));
                velocity.x += (keys.ArrowLeft ? -0.5 : 0) * playerSpeed;
                velocity.x += (keys.ArrowRight ? 0.5 : 0) * playerSpeed;
                velocity.x += (Math.random() - 0.5) * 0.02;
                console.log("Hit the player color changed");
              
              
              
                ball.material.color.set(0xff0000); // Change to red
                setTimeout(() => {
                    ball.material.color.set("orange"); // Change back to white
                }, 400);
             
             
             
             
             
                velocity.z = -velocity.z; // Reverse the X direction
        }
            
       if (ball.position.z >= boot.position.z && ball.position.z <= boot.position.z + (speed + paddleSize.z)
            && ball.position.x <= (boot.position.x + (paddleSize.x / 1.5))
            && ball.position.x >= (boot.position.x - (paddleSize.x / 1.5))) {
                boundaryHitSound.play();
                // console.log("ball Z ", ball.position.z , "boot Z "  , boot.position.z - (paddleSize.z));
                velocity.x += (keys.ArrowLeft ? -0.5 : 0) * playerSpeed;
                velocity.x += (keys.ArrowRight ? 0.5 : 0) * playerSpeed;
                velocity.x += (Math.random() - 0.5) * 0.02;
                console.log("Hit the boot");

                ball.material.color.set(0xff0000); // Change to red
                setTimeout(() => {
                    ball.material.color.set("orange"); // Change back to white
                }, 400);

                velocity.z = -velocity.z; // Reverse the X direction
        }
        
        if ((ball.position.x >= (tableWidth / 2) - 1.5) || (ball.position.x <= -(tableWidth / 2) + 1.5))
        {
            boundaryHitSound.play();
            // console.log("TOK");
            // if (keys.ArrowLeft)
            //     velocity
            velocity.x = -velocity.x; // Reverse the X direction
        }
    }

    function ballOut() {
        if(ball.position.z <= -(tableHeight / 2)) {
            // console.log("Z:", player1BB.min.z);
            // console.log("Z:", ball.position.z);
            WallL.material.color.set(0x00ff00);
            WallL.material.emissive.set(0x00ff00);
            WallR.material.color.set(0x00ff00);
            WallR.material.emissive.set(0x00ff00);
            rectLight1.color.set(0x00ff00);
            rectLight3.color.set(0x00ff00);

            WallL1.material.color.set(0xff0000);
            WallL1.material.emissive.set(0xff0000);
            WallR1.material.color.set(0xff0000);
            WallR1.material.emissive.set(0xff0000);
            rectLight2.color.set(0xff0000);
            rectLight4.color.set(0xff0000);

            playerPoints += 1;
            bootSpeed += 0.025;
            console.log("player : ", playerPoints);
            console.log("AIboot : ", bootPoints);
            ball.position.set(0, 0.1, 0);
            velocity.x = speed;
            velocity.z = speed;
            // createParticles(ball.position);
            shakeCamera();
            updateScore();
        }
        else if(ball.position.z >= (tableHeight / 2)){
            bootPoints += 1;
            WallL.material.color.set("red");
            WallL.material.emissive.set("red");
            WallR.material.color.set("red");
            WallR.material.emissive.set("red");
            rectLight1.color.set("red");
            rectLight3.color.set("red");

            WallL1.material.color.set(0x00ff00);
            WallL1.material.emissive.set(0x00ff00);
            WallR1.material.color.set(0x00ff00);
            WallR1.material.emissive.set(0x00ff00);
            rectLight2.color.set(0x00ff00);
            rectLight4.color.set(0x00ff00);

            console.log("player : ", playerPoints);
            console.log("AIboot : ", bootPoints);
            ball.position.set(0, 0.1, 0);
            velocity.x = speed;
            velocity.z = speed;
            shakeCamera();
            updateScore();
            // createParticles(ball.position);
        }
    }


    function createScore() {
        FontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
            const playerScore = new THREE.TextGeometry(`${playerPoints}`, {
                font: font,
                size: 10,
                height: 0.01
            });
            playerScoreMesh = new THREE.Mesh(playerScore, new THREE.MeshBasicMaterial({color: "white"}));
            playerScoreMesh.position.set(-3.5, -0.4, 14);
            playerScoreMesh.rotation.x = -Math.PI / 2;
            scene.add(playerScoreMesh);
            console.log("Player Score: ", playerScoreMesh);

            const AIbootScore = new THREE.TextGeometry(`${bootPoints}`, {
                font: font,
                size: 10,
                height: 0.01
            });
            AIbootScoreMesh = new THREE.Mesh(AIbootScore, new THREE.MeshBasicMaterial({color: "white"}));
            AIbootScoreMesh.position.set(-3.5, -0.4, -14);
            AIbootScoreMesh.rotation.x = Math.PI / 2;
            scene.add(AIbootScoreMesh);
            console.log("Player Score: ", AIbootScoreMesh);
        });
    }

    function updateScore() {
        scoreSound.play();
        scene.remove(playerScoreMesh);
        scene.remove(AIbootScoreMesh);
        createScore();
    }

    function createBox() {
        playerColletion = new THREE.Mesh(
            new THREE.BoxGeometry(paddleSize.x + paddleSize.x / 1.5, paddleSize.y, paddleSize.z * 2),
            new THREE.MeshBasicMaterial({wireframe : true})
        );
        playerColletion.position.copy(player1.position);
        scene.add(playerColletion);
    }

    function createParticles(position) {
        console.log("create VFX");
        const particleCount = 50;
        const particles = new THREE.Geometry();
        const pMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1.0,
            size: 0.2,
        });
    
        for (let p = 0; p < particleCount; p++) {
            const pX = position.x + (Math.random() - 0.5);
            const pY = position.y + (Math.random() - 0.5);
            const pZ = position.z + (Math.random() - 0.5);
            particles.vertices.push(new THREE.Vector3(pX, pY, pZ));
        }
    
        particleSystem = new THREE.Points(particles, pMaterial);
        scene.add(particleSystem);
    
        // Remove particles after a short duration
        setTimeout(() => {
            scene.remove(particleSystem);
        }, 500);
    }

    function shakeCamera() {
        const originalPosition = camera.position.clone();
        const shakeStrength = 0.2;
        const shakeDuration = 200; // in milliseconds
    
        const startTime = Date.now();
        function shake() {
            const elapsed = Date.now() - startTime;
            if (elapsed < shakeDuration) {
                camera.position.x = originalPosition.x + ((Math.random() - 1) * 2) * shakeStrength;
                camera.position.y = originalPosition.y + ((Math.random() - 1) * 2) * shakeStrength;
                requestAnimationFrame(shake);
            } else {
                camera.position.copy(originalPosition); // Reset camera position
            }
        }
        shake();
    }

}
