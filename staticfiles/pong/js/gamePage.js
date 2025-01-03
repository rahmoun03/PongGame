import { render } from './render.js';
import { menu } from './loby.js';
import { waitingPage } from './waiting.js';
import { GameOver } from './gameOver.js'
import { tournamentPage } from './tournament.js'
import { matchmakingPage } from './tournament_matchmaking.js';
import { tournamentlocal } from './localTournament.js';
import { manageLocalTournament } from './manage_local_tour.js';
// import { matchmakingPage } from './localmatchmaking.js';

import { createWinnerCard } from './winnerCard.js';

class GamePage extends HTMLElement {

    constructor() {
        super();

        // Create Shadow DOM
        const shadow = this.attachShadow({ mode: 'open' });


        // Create container div
        const main = document.createElement('div');
        main.classList.add('game-page');

        // create style

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                height: 100%;
                width: 100%;
            }
            .game-page {
                font-family: "Pong War", sans-serif;
                color: var(--white);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                width: 100%;
            }
        `;
        shadow.appendChild(style);
        shadow.appendChild(main);
        render(menu(), main);
    }
}

customElements.define('game-page', GamePage);
