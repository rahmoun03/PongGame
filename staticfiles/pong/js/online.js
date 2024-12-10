window.online_mode = () => {
    const canvas = document.getElementById("pongCanvas");
    const menu = document.getElementById("menu");
    const ctx = canvas.getContext("2d");
    const waitingPage = document.getElementById("waiting");


    const online_URL = 'ws://'+window.location.host+'/ws/online/';
    const socket = new WebSocket(online_URL);
    let wsOpen = false;
    canvas.width = 800;
    canvas.height = 400;
    const selectedMode = "online";
    let ball , player, player2, paddle, score, animationId;
    let playerDirection = 0;


    resizeCanvas();

    // Handle WebSocket events
    socket.onopen = () => {
        wsOpen = true;
        console.log("Connected to the WebSocket!");
        socket.send(JSON.stringify({
			type: "join_room",
			width: canvas.width,
			height: canvas.height
		}));
    };

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

    // Draw everything
    function draw() {
        ctx.fillStyle = "gray";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "orange";
        ctx.fill();
        ctx.closePath();

        // center line
        ctx.fillStyle = "white";
        ctx.fillRect((canvas.width / 2) - 1, 0, 2, canvas.height);
        

        // Player paddle'
        ctx.fillStyle = "white";
        ctx.fillRect(player.x, player.y, paddle.width, paddle.height);

        // player2 paddle
        ctx.fillStyle = "white";
        ctx.fillRect(player2.x, player2.y, paddle.width, paddle.height);

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
        if(wsOpen)
            sendPaddlePosition();
    }
  

    // Send paddle position to server
    function sendPaddlePosition() {
        console.log("sending  data ...");
        socket.send(JSON.stringify({
            type: "update_paddle",
            direction : playerDirection,
            mode: selectedMode,
        }));
    }
    document.addEventListener("keydown", movePaddle);
    document.addEventListener("keyup", stopPaddle);
    window.addEventListener("resize", () => {
        resizeCanvas();
        socket.send(JSON.stringify({
            type: "resize",
            width: canvas.width,
            height: canvas.height
        }));
    });

    function movePaddle(e)
    {
        console.log("move paddle");
        if(e.key === 'ArrowUp') playerDirection = -1;
        if(e.key === 'ArrowDown') playerDirection = 1;
    }

    function stopPaddle(e)
    {
        if (e.key === "ArrowUp" || e.key === "ArrowDown")
            playerDirection = 0;
    }
    function endGame(winner) {
        // Stop the game loop
        cancelAnimationFrame(animationId);
        // Display the game over screen
        document.getElementById("gameOver").style.display = "flex";
        document.getElementById("winner").innerText = `You ${winner}`;
        document.getElementById("score").innerText = `${score.player1} - ${score.player2}`;
        canvas.style.display = "none";
        console.log("GAME OVER !");
    }
    
    function resizeCanvas() {
        const aspectRatio = 800 / 400; // Original width/height ratio
        const maxWidth = window.innerWidth * 0.8; // Use 80% of screen width
        const maxHeight = window.innerHeight * 0.4; // Use 60% of screen height
    
        if (maxWidth / aspectRatio <= maxHeight) {
            canvas.width = maxWidth;
            canvas.height = maxHeight;
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