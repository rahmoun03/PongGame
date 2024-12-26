import { render  } from "./render.js";
import { GameOver } from "./gameOver.js";
import { tournamentBracket } from "./bracket.js";

function gameCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'flex';
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    
    return canvas;
}

function createcountdown() {
    const countdown = document.createElement('div');
    countdown.classList.add('countdown');
    countdown.style.display = 'none';

    return countdown;
}

export function tournamentMatch()
{
    const style = document.createElement('style');
    style.textContent = `
        canvas {
            width: 100%;
            height: 100%;
        }
        .countdown {
            color: var(--red);
            text-shadow: 2px 0 white, -2px 0 white, 0 2px white, 0 -2px white,
                1px 1px white, -1px -1px white, 1px -1px white, -1px 1px white;
            position: absolute;
            top: 0px;
            left: 0px;
            text-align: center;
            place-content: center;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 0, 0, 0);
        }
        .pongCanvas {
            display: flex;
            position: absolute;
            top: 0px;
            left: 0px;
            width: 100%;
            height: 100%;
            justify-content: center;
            align-items: center;
        }
    `;
    const countdownElement = createcountdown();
    const canvas = gameCanvas();

    const pongCanvas = document.createElement('div');
    pongCanvas.classList.add('pongCanvas');

    pongCanvas.appendChild(style);
    pongCanvas.appendChild(canvas);
    pongCanvas.appendChild(countdownElement);

    const local_URL = 'ws://'+window.location.host+'/ws/local_1vs1/';
    let wsOpen = false;
    const selectedMode = "local_1vs1";
    let ball_config, ball, player1_config, player2_config, plane, table_config, paddle, score, animationId, role, composer;
    let player2Direction = 0, player1Direction = 0;
    let player1ScoreMesh, player2ScoreMesh;
    let player1 , player2;
    let renderer, controls;
    
    const gui = new dat.GUI();
    
    const TableG = new THREE.Group();
    const FontLoader = new THREE.FontLoader();
    
    let tableWidth, tableHeight;
    const scene = new THREE.Scene();

    let width = canvas.width ;
    let height = canvas.height ;

    console.log("sizes : ", width, height);
    
    const axesHelper = new THREE.AxesHelper(width / 2);
    scene.add(axesHelper);
    axesHelper.visible = false;
    
    let stats = new Stats();
    const camera1 = new THREE.PerspectiveCamera(75, (width / 2) / height, 0.1, 2000);
    const camera2 = new THREE.PerspectiveCamera(75, (width / 2) / height, 0.1, 2000);
    
    camera1.position.set(0, 30, 25);
    camera2.position.set(0, 30, -25);
    camera2.lookAt(0, 0, 0);
    scene.add(camera1, camera2);
    
    
    const grid = new THREE.GridHelper( 1000, 1000, 0xaaaaaa, 0xaaaaaa );
    grid.material.opacity = 1;
    grid.material.transparent = true;
    grid.position.y = -1;
    scene.add( grid );
    grid.visible = false;
    function initRenderer(){
        
        renderer = new THREE.WebGLRenderer( {canvas, antialias: true} );
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        document.body.appendChild( stats.dom );
        controls = new THREE.OrbitControls( camera1, renderer.domElement );
    }
    
    
    const directionalLight = new THREE.DirectionalLight(0xfdfbd3, 10, 800);
    directionalLight.position.set(0, 500, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    directionalLight.visible = false;
    
    
    const socket = new WebSocket(local_URL);
    // Handle WebSocket events
    socket.onopen = () => {
        wsOpen = true;
        console.log("Connected to the WebSocket!");
        socket.send(JSON.stringify({
			type: "countdown",
			width: width,
			height: height
		}));
    };
    socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.table('data', data)
        if (data.type === "start") {
            render(pongCanvas, document.body.querySelector('.game-page').shadowRoot.querySelector('.game-page'));
            initRenderer();
            table_config = data.table;
            paddle = data.paddle;
            player1_config = data.player1;
            player2_config = data.player2;
            ball_config = data.ball;
            score = data.score;

            table();
            ballCreation();
            playerCreation();
            createScore();
            guiControl();

            startCountdown(3, () => {
                animate();
                socket.send(JSON.stringify({ 
                    type: "start_game",
                }));
                console.log("sending start_game");
            });
        }
        if (data.type === "update") {

            player1.position.x = data.player1.x;
            player2.position.x = data.player2.x;
            ball.position.x = data.ball.x;
            ball.position.z = data.ball.z;
            score = data.score;
        }
        if (data.type === "goal") {
            player1.position.x = data.player1.x;
            player2.position.x = data.player2.x;
            ball.position.x = data.ball.x;
            ball.position.z = data.ball.z;
            score = data.score;
            shakeCamera(camera1);
            shakeCamera(camera2);
            updateScore();
        }
        if (data.type === "game_over") {
            score = data.score;
            cancelAnimationFrame(animationId);
            socket.close();
            const results = {
                round1: [
                    { winner: 'Team 2', scores: [3, 7] },
                    { winner: 'Team 3', scores: [6, 5] }
                ],
                final: { winner: 'Team 3', scores: [5, 10] }
            }
            tournamentBracket(participants, score);
        }
    };
    socket.onclose = () => {
        wsOpen = false;
        console.log("WebSocket closed!");
    };
    socket.onerror = () => {
        wsOpen = false;
        console.log("Connection Error for WebSocket!");
    }

    document.addEventListener("keydown", movePaddle);
    document.addEventListener("keyup", stopPaddle);

    function movePaddle(e)
    {
        if(e.key === 'ArrowLeft') player2Direction = -1;
        if(e.key === 'ArrowRight') player2Direction = 1;
        if(e.key === 'a') player1Direction = -1;
        if(e.key === 'd') player1Direction = 1;
    }

    function stopPaddle(e)
    {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight")
            player2Direction = 0;
        if (e.key === "a" || e.key === "d")
            player1Direction = 0;
    }
    window.addEventListener("resize", () => {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;

        width = canvas.width;
        height = canvas.height;
        camera1.aspect = (width / 2) / height;
        camera2.aspect = (width / 2) / height;
        camera2.updateProjectionMatrix();
        camera1.updateProjectionMatrix();
        renderer.setSize(width , height);
    });

    function table() {
        tableHeight = table_config.tableHeight;
        tableWidth = table_config.tableWidth;
        plane = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, tableHeight),
            new THREE.MeshPhysicalMaterial( {
                side: THREE.DoubleSide,
                reflectivity: 0,
                transmission: 1.0,
                roughness: 0.2,
                metalness: 0,
                clearcoat: 0.3,
                clearcoatRoughness: 0.25,
                color: new THREE.Color(0xffffff),
                ior: 1.2,
                thickness: 10.0
            } )
        );
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(0, -0.49, 0);
        TableG.add(plane);
        tableBound(tableWidth, tableHeight);
        tableWalls(tableWidth, tableHeight);
    }

    function tableBound(tableWidth, tableHeight){

    //////////////////////////////////////////////////
        const tableCenter = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, 0.2),
            new THREE.MeshBasicMaterial({color: "white"})
        );
        tableCenter.receiveShadow = true;
        tableCenter.rotation.x = -Math.PI / 2;
        tableCenter.position.set(0, plane.position.y + 0.01, 0);
        TableG.add(tableCenter);
    /////////////////////////////////////////////////
        const boundM = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, 0.1),
            new THREE.MeshBasicMaterial({color: "white"})
        );
        boundM.receiveShadow = true;
        boundM.rotation.x = -Math.PI / 2;
        boundM.position.set(0, plane.position.y + 0.01, tableHeight / 2);
        TableG.add(boundM);
    ///////////////////////////////////////////////////////
        const boundY = new THREE.Mesh(
            new THREE.PlaneGeometry(tableWidth, 0.1),
            new THREE.MeshBasicMaterial({color: "white"})
        );
        boundY.receiveShadow = true;
        boundY.rotation.x = -Math.PI / 2;
        boundY.position.set(0, plane.position.y + 0.01, -(tableHeight / 2));
        TableG.add(boundY);
    }


    function tableWalls(tableWidth, tableHeight) {

    /////////////////////////////////////////////
        const WallL = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: "cyan",
                emissive: "cyan", // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        WallL.position.set(-(tableWidth / 2) + 0.5, 0, tableHeight / 4);
        TableG.add(WallL);
        
        const rectLight1 = new THREE.RectAreaLight( "cyan", 2, tableHeight / 2, 3 );
        rectLight1.position.set( WallL.position.x + 0.5, WallL.position.y , WallL.position.z);
        rectLight1.rotation.y = -Math.PI / 2;
        TableG.add( rectLight1 );
    /////////////////////////////////////////////
        const WallL1 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00, // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
                })
        );
        WallL1.position.set(-(tableWidth / 2) + 0.5, 0, -(tableHeight / 4));
        TableG.add(WallL1);

        const rectLight2 = new THREE.RectAreaLight( 0x00ff00, 2, tableHeight / 2, 3 );
        rectLight2.position.set( WallL1.position.x + 0.5, WallL1.position.y, WallL1.position.z);
        rectLight2.rotation.y = -Math.PI / 2;
        TableG.add( rectLight2 );
    ///////////////////////////////////////////////
        const WallR = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00, // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        WallR.position.set(tableWidth / 2 - 0.5, 0, tableHeight / 4);
        TableG.add(WallR);

        const rectLight3 = new THREE.RectAreaLight( 0x00ff00, 2, tableHeight / 2, 3 );
        rectLight3.position.set( WallR.position.x - 0.5, WallR.position.y, WallR.position.z);
        rectLight3.rotation.y = Math.PI / 2;
        TableG.add( rectLight3 );
    ///////////////////////////////////////////////////
        const WallR1 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, tableHeight / 2),
            new THREE.MeshToonMaterial({
                color: "cyan",
                emissive: "cyan", // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        WallR1.position.set(tableWidth / 2 - 0.5, 0, -(tableHeight / 4));
        TableG.add(WallR1);

        const rectLight4 = new THREE.RectAreaLight( "cyan", 2, tableHeight / 2, 3 );
        rectLight4.position.set( WallR1.position.x - 0.5, WallR1.position.y, WallR1.position.z);
        rectLight4.rotation.y = Math.PI / 2;
        TableG.add( rectLight4 );
    //////////////////////////////////////////////////////
        scene.add(TableG);
    }

    function ballCreation() {

        ball = new THREE.Mesh(
            new THREE.SphereGeometry(ball_config.radius, 32, 32),
            new THREE.MeshToonMaterial( { 
                color: "orange",
                emissive: "orange", // Emissive color (glow effect)
                emissiveIntensity: 0.8 // Intensity of the emissive effect
            })
        );
        ball.position.set(ball_config.x, ball_config.y, ball_config.z);
        scene.add(ball);
    }

    function playerCreation() {
        player1 = new THREE.Mesh(
            new THREE.BoxGeometry(paddle.width, paddle.height, paddle.deep),
            new THREE.MeshToonMaterial({
                color: "cyan",
                emissive: "cyan",
                emissiveIntensity: 1.0
            })
        );
        player1.position.set(0, 0, (tableHeight / 2) - (paddle.deep / 2));
        scene.add(player1);

        player2 = new THREE.Mesh(
            new THREE.BoxGeometry(paddle.width, paddle.height, paddle.deep),
            new THREE.MeshToonMaterial({
                color: "red",
                emissive: "red",
                emissiveIntensity: 1.0
            })
        );
        player2.position.set(0, 0, -(tableHeight / 2) + (paddle.deep / 2));
        scene.add(player2);
    }


    function createScore() {
        FontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
            const player1Score = new THREE.TextGeometry(`${score.player1}`, {
                font: font,
                size: 10,
                height: 0.01
            });
            player1ScoreMesh = new THREE.Mesh(player1Score, new THREE.MeshBasicMaterial({color: "white"}));
            player1ScoreMesh.position.set(-3.5, -0.4, 14);
            player1ScoreMesh.rotation.x = -Math.PI / 2;
            scene.add(player1ScoreMesh);

            const player2Score = new THREE.TextGeometry(`${score.player2}`, {
                font: font,
                size: 10,
                height: 0.01
            });
            player2ScoreMesh = new THREE.Mesh(player2Score, new THREE.MeshBasicMaterial({color: "white"}));
            player2ScoreMesh.position.set(3.5, -0.4, -14);
            player2ScoreMesh.rotation.y = Math.PI;
            player2ScoreMesh.rotation.x = Math.PI / 2;
            scene.add(player2ScoreMesh);
        });
    }

    function updateScore() {
        scene.remove(player1ScoreMesh);
        scene.remove(player2ScoreMesh);
        createScore();
    }

    function guiControl(){
        gui.add(camera1.position, "x",);
        gui.add(camera1.position, "y");  
        gui.add(camera1.position, "z");
        gui.add(camera2.position, "x",).name("camera 2 x");
        gui.add(camera2.position, "y").name("camera 2 y");  
        gui.add(camera2.position, "z").name("camera 2 z");
        gui.add(directionalLight, "visible").name("directional Light");
        gui.add(grid, "visible").name("grid");
        gui.add(axesHelper, "visible").name("helper");
        gui.close();
    }

    function animate ()
    {
        animationId = requestAnimationFrame(animate);
        stats.update();
        controls.update();

        drawing();
        if (wsOpen)
            sendPaddlePosition();

    }

    function sendPaddlePosition() {

        socket.send(JSON.stringify({
            type: "update_paddle",
            player1_Direction : player1Direction,
            player2_Direction : player2Direction,
            mode: selectedMode,
        }));
    }

    function shakeCamera(camera, intensity = 0.3, duration = 0.5) {
        const originalPosition = camera.position.clone(); // Store the original position
    
        // Animate shaking
        gsap.to(camera.position, {
            x: `+=${intensity}`,
            y: `+=${intensity}`,
            z: `+=${intensity}`,
            duration: duration / 4,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                // Reset camera position after shaking
                camera.position.copy(originalPosition);
            }
        });
    }
    

    function startCountdown(duration, onComplete) {
        countdownElement.style.display = 'flex'; // Hide the countdown element

        let timeLeft = duration;
        let opacity = 1; // Initial opacity for fading effect
        let scale = 1; // Initial scale for size animation
    
    
        // Update the countdown every second
        const interval = setInterval(() => {
            // renderer.render( scene, camera1 );
            drawing();

            countdownElement.style.fillStyle = `rgba(255, 255, 255, ${opacity})`; // Fading effect
            countdownElement.style.font = `${100 * scale}px "Pong War", "Freeware"`; // Dynamic scaling
            countdownElement.textContent = timeLeft > 0 ? timeLeft : "GO!"; // Display the time
            scale += 0.1; // Gradually increase size
            opacity -= 0.1; // Gradually fade out
    
            if (opacity <= 0) {
                scale = 1; // Reset size
                opacity = 1; // Reset opacity
                timeLeft-- ; // Move to the next countdown value
            }


            if (timeLeft < 0) {
                clearInterval(interval); // Stop the countdown
                countdownElement.style.display = 'none'; // Hide the countdown element
                onComplete(); // Trigger the game start
            }
        }, 60);
    }


    function drawing(){
        // Render for the first view (Player 1)  blue player in the left side 
        renderer.setViewport(0, 0, width / 2, height);
        renderer.setScissor(0, 0, width / 2, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera1);
        
        // Render for the first view (Player 2) red player in the right side 
        renderer.setViewport(width / 2, 0, width / 2, height);
        renderer.setScissor(width / 2, 0, width / 2, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera2);
    }
}
