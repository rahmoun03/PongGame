const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const start = document.getElementById("startBT");

canvas.width = 800; 
canvas.height = 400;

let animationId;

let aiSpeed = 1; // Default AI paddle speed

const scoreLimit = 5; // First to 5 wins


// Difficulty buttons
const difficultyButtons = document.querySelectorAll(".difficultyBtn");

// Set AI speed based on selected difficulty
difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
        aiSpeed = parseInt(button.getAttribute("data-speed"));
        difficultyButtons.forEach((btn) => btn.style.backgroundColor = ""); // Reset button styles
        button.style.backgroundColor = "lightgreen"; // Highlight selected button
		console.log("you select ", button.innerText || button.textContent);
		
    });
});

// Ball setup
let ball = {
	x: canvas.width / 2,
	y: canvas.height / 2,
	dx: (Math.random() > 0.5 ? 3 : -3),
	dy: (Math.random() > 0.5 ? 3 : -3),
	radius: 10
};

let playerScore = 0;
let aiScore = 0;

// Paddle setup

let paddleWidth = 10;
let paddleHeight = 80;
let playerDirection = 0;
let player = {
	x: 5,
	y: canvas.height / 2 - paddleHeight / 2,
	speed: 5,
};
let ai = {
	x: canvas.width - paddleWidth - 5,
	y: canvas.height / 2 - paddleHeight / 2,
};

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
	ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);

	// AI paddle
	ctx.fillStyle = "white";
	ctx.fillRect(ai.x, ai.y, paddleWidth, paddleHeight);

	// Scores
	ctx.fillStyle = "white";
	ctx.font = "30px Arial";
	ctx.fillText(playerScore, canvas.width / 4, 30); // Player score on the left
	ctx.fillText(aiScore, (canvas.width / 4) * 3, 30); // AI score on the right
}

// Update positions
function update() {
	ball.x += ball.dx;
	ball.y += ball.dy;

	// Ball collision with top/bottom
	if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
		ball.dy *= -1;
	}

	// Ball collision with paddles
	ballCollision();

	// Check for goals
	checkGoals();

	// Add logic here!
	updatePlayer();
}

// Game loop
function loop() {
	animationId = requestAnimationFrame(loop);

	update();
	draw();
}

const URL = 'ws://'+window.location.host+'/ws/pong/';

console.log("the URL is : ", URL);


const socket = new WebSocket(URL);

// Handle WebSocket events
socket.onopen = () => {
    console.log("Connected to the WebSocket!");
};

socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
	console.log('data', data)
    if (data.message.type === "update") {
        // Update ball or paddle positions
        ball.x = data.message.ball.x;
        ball.y = data.message.ball.y;
        ai.y = data.message.ai.y;
        player.y = data.message.player.y;
    }
};

socket.onclose = () => {
    console.log("WebSocket closed!");
};

// Send paddle position to server
function sendPaddlePosition() {
    socket.send(JSON.stringify({
        type: "update",
        player: { y: player.y },
        ball: { x: ball.x, y: ball.y }
    }));
}

// Call this function during paddle movement
setInterval(sendPaddlePosition, 50); // Send updates every 50ms



document.addEventListener("keydown", movePaddle);
document.addEventListener("keyup", stopPaddle);
start.addEventListener("click", () => {
	if (!aiSpeed) aiSpeed = 1;
		
	start.style.display = 'none';
	canvas.style.display = 'block';
	loop();
});


function movePaddle(e)
{   
	if(e.key === 'ArrowUp') playerDirection = -1;
	if(e.key === 'ArrowDown') playerDirection = 1;
}

function stopPaddle(e)
{
	if (e.key === "ArrowUp" || e.key === "ArrowDown") playerDirection = 0;
}

function updatePlayer(){
	// console.log("move!");
	player.y += playerDirection * player.speed;
	if (player.y  < 0) player.y = 0;
	if (player.y + paddleHeight > canvas.height) player.y = canvas.height - paddleHeight;

	// Move AI paddle (simple tracking)
	if (ai.y + paddleHeight / 2 < ball.y) ai.y += aiSpeed; // Move down
	if (ai.y + paddleHeight / 2 > ball.y) ai.y -= aiSpeed; // Move up
	if (ai.y  < 0) ai.y = 0;
	if (ai.y + paddleHeight > canvas.height) ai.y = canvas.height - paddleHeight;
}

function ballCollision(){
	// Ball collision with player paddle
	if (ball.x - ball.radius < player.x + paddleWidth &&
		ball.x - ball.radius > player.x &&
		ball.y > player.y && ball.y < player.y + paddleHeight) {
			//from bottom
		if(ball.y > player.y + (paddleHeight - (paddleHeight / 10))) ball.dy *= (ball.dy < 0 ? -1 : 1);
		 	//from up
		else if(ball.y < player.y +  paddleHeight / 10) ball.dy *= (ball.dy > 0 ? -1 : 1);
		ball.dx *= -1; // Bounce the ball back
		// Optional: add some speed boost
		ball.dx *= 1.05; // Ball speed increase after hit
		console.log("ball speed : ", ball.dx);
		
	}

	// Ball collision with AI paddle
	if (ball.x + ball.radius > ai.x &&
		ball.x + ball.radius < ai.x + paddleHeight &&
		ball.y > ai.y && ball.y < ai.y + paddleHeight) {
				//from bottom
		if(ball.y > ai.y + (paddleHeight - (paddleHeight / 10))) ball.dy *= (ball.dy < 0 ? -1 : 1);
				//from up
		else if(ball.y < ai.y +  paddleHeight / 10) ball.dy *= (ball.dy > 0 ? -1 : 1);
		ball.dx *= -1; // Bounce the ball back
		// Optional: add some speed boost
		ball.dx *= 1.05; // Ball speed increase after hit
	}

}

function checkGoals(){
	// Check for goals
	if (ball.x < 0) {
		aiScore++; // AI scores
		resetBall();
	}
	if (ball.x > canvas.width) {
		playerScore++; // Player scores
		resetBall();
	}

	// Check for game over
	if (playerScore >= scoreLimit || aiScore >= scoreLimit) {
		endGame(playerScore > aiScore ? "You" : "AI");
		return; // Stop updating
	}
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 3 : -3); // Random direction
    ball.dy = (Math.random() > 0.5 ? 3 : -3);
}

function endGame(winner) {
    // Stop the game loop
    cancelAnimationFrame(animationId);

    // Display the end screen
    menu.innerHTML = `
        <h1>Game Over!</h1>
        <p>${winner} Wins!</p>
    `;
    menu.style.display = "flex";
    canvas.style.display = "none";
}


