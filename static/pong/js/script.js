const canvas = document.getElementById("pongCanvas");
const menu = document.getElementById("menu");
const waitingPage = document.getElementById("waiting");

const ai_URL = 'ws://'+window.location.host+'/ws/ai/';
const online_URL = 'ws://'+window.location.host+'/ws/online/';
const local_URL = 'ws://'+window.location.host+'/ws/local/';
const tournament_URL = 'ws://'+window.location.host+'/ws/tournament/';

// Buttons
document.getElementById('multiplayer').addEventListener('click', () => {
	const options = document.getElementById('multiplayerOptions');
    options.style.display = options.style.display === 'none' ? 'block' : 'none';
});
document.getElementById("ai").addEventListener("click", () => startGame("ai"));
document.getElementById("onlineMultiplayer").addEventListener("click", () => startGame("onlineMultiplayer"));
document.getElementById("localMultiplayer").addEventListener("click", () => startGame("localMultiplayer"));
document.getElementById("tournament").addEventListener("click", () => startGame("tournament"));
document.getElementById("train").addEventListener("click", () => startGame("train"));


function startGame(mode) {
	// multiplayer mode
	if (mode === "localMultiplayer") {
		console.log("you select local mode");
        menu.style.display = "none";
		canvas.style.display = "block";
		window.local();

    }
	else if (mode === "onlineMultiplayer") {
		console.log("you select online mode");
        menu.style.display = "none";
        waitingPage.style.display = "flex"; // Show waiting page
		window.online_mode();
    }

	// tournament mode
	else if (mode === "tournament") {
		console.log("you select tournament mode");
        menu.style.display = "none";
        waitingPage.style.display = "flex"; // Show waiting page
        socket.send(JSON.stringify({
            type: "tournament",
            mode: mode,
        }));
    }

	// AI mode
	else if (mode === "ai" ) {
		console.log("you select AI mode");
		canvas.style.display = 'block';
		menu.style.display = 'none';
		window.ai();
	}
	else if (mode === "train" ) {
		console.log("you select Train mode");
        menu.style.display = "none";
		canvas.style.display = "block";
        waitingPage.style.display = "flex"; // Show waiting page
		window.play();
	}
}
