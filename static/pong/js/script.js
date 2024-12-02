const canvas = document.getElementById("pongCanvas");
const menu = document.getElementById("menu");
const ctx = canvas.getContext("2d");
const waitingPage = document.getElementById("waiting");
const URL = 'ws://'+window.location.host+'/ws/pong/';
const socket = new WebSocket(URL);

canvas.width = 800;
canvas.height = 400;
 let playerRole;

// Ball setup
let ball , player, player2, paddle, score, selectedMode, animationId;
let playerDirection = 0;

// Draw everything
function draw() {
	ctx.fillStyle = "gray";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Ball
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
	ctx.fillStyle = "white";
	ctx.fill();
	ctx.closePath();

	// center line
	ctx.fillStyle = "white";
	ctx.fillRect((canvas.width / 2) - 1, 0, 2, canvas.height);
	

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

// Handle WebSocket events
socket.onopen = () => {
    console.log("Connected to the WebSocket!");
};

socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
	console.log('data', data)
    if (data.type === "start") {
		// Hide the waiting page and start the game
		waitingPage.style.display = "none";
		canvas.style.display = "block";
		playerRole = data.player;
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

// Send paddle position to server
function sendPaddlePosition() {
    socket.send(JSON.stringify({
        type: "update_paddle",
        playerDirection : playerDirection,
		mode: selectedMode,
		player: playerRole
    }));
}


document.addEventListener("keydown", movePaddle);
document.addEventListener("keyup", stopPaddle);
// Buttons
document.getElementById("classic").addEventListener("click", () => startGame("Classic"));
document.getElementById("multiplayer").addEventListener("click", () => startGame("Multiplayer"));

function startGame(mode) {

	if (mode === "Multiplayer") {
        menu.style.display = "none";
        waitingPage.style.display = "flex"; // Show waiting page

        socket.send(JSON.stringify({
            type: "join_multiplayer",
            mode: mode,
        }));
    }
	else if (mode === "Classic" ) {

		canvas.style.display = 'block';
		menu.style.display = 'none';
		selectedMode = mode;
		resizeCanvas();
		socket.send(JSON.stringify({ 
			type: "countdown",
			mode: mode,
			width: canvas.width,
			height: canvas.height
		}));
	}
}


function movePaddle(e)
{
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
