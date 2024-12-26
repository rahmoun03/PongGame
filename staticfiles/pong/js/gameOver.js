import { render } from "./render.js";
import { menu } from "./loby.js";

let context = {
    player1 : 5,
    player2 : 5
};



export function GameOver(winnerContent = "WIN", scoreContent = context) {
    const gamePage = document.body.querySelector('game-page')
    const style = document.createElement('style');
    style.textContent = `
        .game-over {
            font-family: "Pong War";
            display: flex;
            flex-direction: column;
            justify-content: center;
            place-items: center;
            align-items: center;
            width: 100%;
            height: 100%; 
            background: rgb(0, 0, 0);
            color: white;
            text-shadow: 2px 2px 5px rgba(255, 255, 255, 1);

        }
        .game-over-title {
            font-family: "Pong War", "Freeware";
            font-weight: bold;
            font-size: 120px;
            margin-bottom: 20px;
            color: var(--red);
            text-shadow: 2px 0 white, -2px 0 white, 0 2px white, 0 -2px white,
                    1px 1px white, -1px -1px white, 1px -1px white, -1px 1px white;
        }
        button {
            font-family: "Pong War";
            padding: 10px 10px;
            width: 20%;
            margin-bottom: 10px;
            letter-spacing: 2px;
            color: white;
            background-color: var(--red);
            border: 1px solid white;
            border-radius: 5px;
            cursor: pointer;
            transition: 0.5s ease;
        }
        button:hover {
            background-color: gray;
        }
    `;
    const gameOver = document.createElement('div');
    const gameOverText = document.createElement('p');
    const winner = document.createElement('p');
    const score = document.createElement('p');
    const playAgainButton = document.createElement('button');
    const homeButton = document.createElement('button');
    const gameOverImage = document.createElement('div');

    gameOver.classList.add('game-over');
    gameOverText.classList.add('game-over-title');
    gameOverText.textContent = 'Game Over';
    playAgainButton.textContent = 'Play Again';
    homeButton.textContent = 'Home';
    gameOverImage.classList.add('game_over_image');

    winner.textContent = `YOU ${winnerContent}`;
    score.textContent = `${scoreContent.player1} - ${scoreContent.player2}`;


    gameOver.appendChild(style);
    gameOver.appendChild(gameOverText);
    gameOver.appendChild(winner);
    gameOver.appendChild(score);
    gameOver.appendChild(playAgainButton);
    gameOver.appendChild(homeButton);
    gameOver.appendChild(gameOverImage);

    playAgainButton.onclick = () => {
        console.log("play again");
        console.log(gamePage);
        render(menu(), gamePage.shadowRoot.querySelector('.game-page'));
    };

    homeButton.onclick = () => {
        console.log("to home");
    };
    
    return gameOver;
}