const canvas = document.getElementById("pongCanvas");
const menu = document.getElementById("menu");
const ctx = canvas.getContext("2d");
const URL = 'ws://'+window.location.host+'/ws/pong/';
const socket = new WebSocket(URL);

canvas.width = 800;
canvas.height = 400;

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
        // Update ball or paddle positions
		ball = data.ball;
		player = data.players["player1"];
		player2 = data.players["player2"];
		score = data.score;
		paddle = data.paddle
		loop();
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
		mode: selectedMode
    }));
}


document.addEventListener("keydown", movePaddle);
document.addEventListener("keyup", stopPaddle);
// Buttons
document.getElementById("classic").addEventListener("click", () => startGame("Classic"));
document.getElementById("multiplayer").addEventListener("click", () => startGame("Multiplayer"));

function startGame(mode) {
	canvas.style.display = 'block';
	menu.style.display = 'none';
	selectedMode = mode;
	resizeCanvas();
	socket.send(JSON.stringify({ 
		type: "start_game",
		mode: mode,
		width: canvas.width,
		height: canvas.height
	}));
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
    const maxHeight = window.innerHeight * 0.6; // Use 60% of screen height

    if (maxWidth / aspectRatio <= maxHeight) {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
    } else {
        canvas.height = maxHeight;
        canvas.width = maxHeight * aspectRatio;
    }
}


// Call once initially


// hello