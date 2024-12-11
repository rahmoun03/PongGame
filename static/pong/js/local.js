window.local = () => {
    const canvas = document.getElementById("pongCanvas");
    const menu = document.getElementById("menu");
    const ctx = canvas.getContext("2d");
    const waitingPage = document.getElementById("waiting");


    const local_URL = 'ws://'+window.location.host+'/ws/local/';
    const socket = new WebSocket(local_URL);
    
    canvas.width = 800;
    canvas.height = 400;
    const selectedMode = "local";
    let ball , player, player2, paddle, score, animationId;
    let player1Direction = 0;
    let player2Direction = 0;



    resizeCanvas();

    // Handle WebSocket events
    socket.onopen = () => {
        console.log("Connected to the WebSocket!");
        socket.send(JSON.stringify({
			type: "countdown",
			mode: selectedMode,
			width: canvas.width,
			height: canvas.height
		}));
    };

    socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('data', data)
        if (data.type === "start") {
            // Hide the waiting page and start the game
            waitingPage.style.display = "none";
            document.getElementById("canvasSpace").style.display = "flex";
            canvas.style.display = "block";
            ball = data.ball;
            player = data.players["player1"];
            player2 = data.players["player2"];
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
            player = data.players["player1"];
            player2 = data.players["player2"];
            score = data.score;
        }
        if (data.type === "game_over") {
            score = data.score;
            draw();
            endGame(data.winner);
        }
    };

    socket.onclose = () => {
        console.log("WebSocket closed!");
    };

    // Draw everything
    function draw() {
        ctx.fillStyle = "gray";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // center line
        ctx.fillStyle = "white";
        ctx.fillRect((canvas.width / 2) - 1, 0, 2, canvas.height);
        
        // Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();


        // Player paddle'
        ctx.fillStyle = "white";
        ctx.fillRect(player.x, player.y, paddle.W, paddle.H);

        // player2 paddle
        ctx.fillStyle = "white";
        ctx.fillRect(player2.x, player2.y, paddle.W, paddle.H);

        // Scores
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText(score.player1, canvas.width / 4, 30); // Player score on the left
        ctx.fillText(score.player2, (canvas.width / 4) * 3, 30); // AI score on the right
    }

    // Game loop
    function loop() {
        animationId = requestAnimationFrame(loop);
        draw();
        sendPaddlePosition();
    }
  

    // Send paddle position to server
    function sendPaddlePosition() {
        console.log("sending  data ...");

        socket.send(JSON.stringify({
            type: "update_paddle",
            player1_Direction : player1Direction,
            player2_Direction : player2Direction,
            mode: selectedMode,
        }));
    }
    document.addEventListener("keydown", movePaddle);
    document.addEventListener("keyup", stopPaddle);

    function movePaddle(e)
    {
        if(e.key === 'ArrowUp') player2Direction = -1;
        if(e.key === 'ArrowDown') player2Direction = 1;
        if(e.key === 'w') player1Direction = -1;
        if(e.key === 's') player1Direction = 1;
    }

    function stopPaddle(e)
    {
        if (e.key === "ArrowUp" || e.key === "ArrowDown")
            player2Direction = 0;
        if (e.key === "w" || e.key === "s")
            player1Direction = 0;
    }
    function endGame(winner) {
        // Stop the game loop
        cancelAnimationFrame(animationId);

        // Display the end screen
        menu.innerHTML = `
            <h1>Game Over!</h1>
            <p>${winner} Wins!</p>
            <h2>${score.player1}</h2> - <h2>${score.player2}</h2>
        `;
        menu.style.display = "grid";
        canvas.style.display = "none";
        console.log("GAME OVER !");
    }
    function resizeCanvas() {
        const aspectRatio = 800 / 400; // Original width/height ratio
        const maxWidth = window.innerWidth * 0.8; // Use 80% of screen width
        const maxHeight = window.innerHeight * 0.4; // Use 60% of screen height
    
        if (maxWidth / aspectRatio <= maxHeight) {
            canvas.width = maxWidth;
            canvas.height = maxWidth / aspectRatio;
        } else {
            canvas.height = maxHeight;
            canvas.width = maxHeight * aspectRatio;
        }
    }

    function startCountdown(callback) {
        let countdown = 3; // Start at 3
        let opacity = 1; // Initial opacity for fading effect
        let scale = 1; // Initial scale for size animation
    
        const interval = setInterval(() => {
            draw(); // Redraw background and paddles
    
            // Save canvas state
            ctx.save();
            
            // Set text properties
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`; // Fading effect
            ctx.font = `${100 * scale}px Arial`; // Dynamic scaling
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Render countdown or "GO!"
            ctx.fillText(countdown > 0 ? countdown : "GO!", canvas.width / 2, canvas.height / 2);
            
            // Restore canvas state
            ctx.restore();
    
            // Update scaling and fading effects
            scale += 0.1; // Gradually increase size
            opacity -= 0.1; // Gradually fade out
    
            // Reset effects for the next countdown
            if (opacity <= 0) {
                scale = 1; // Reset size
                opacity = 1; // Reset opacity
                countdown--; // Move to the next countdown value
            }
    
            if (countdown < 0) {
                clearInterval(interval); // Stop the interval
                callback(); // Start the game loop
            }
        }, 60); // Short interval for smoother animations
    }
}