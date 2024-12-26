import { render } from "./render.js";
import { menu } from "./loby.js";


export function tournamentBracket(
    matches = [
        { player1: 'T1', player2: 'T2' },	
        { player1: 'T3', player2: 'T4' },
    ],
    currentMatch = 1,
    ws = null,
) {
    const style = document.createElement('style');
    style.textContent = `
        .tournament-container {
            font-family: 'Pong War';
            letter-spacing: 3px;
            padding: 2rem;
            border-radius: 5px;
            color: white;
        }

        .bracket-title {
            font-size: 1.875rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2rem;
            color: white;
        }

        .bracket-content {
            display: flex;
            align-items: center;
            gap: 4rem;
        }

        .round-bracket {
            display: flex;
            flex-direction: column;
            gap: 4rem;
        }

        .match-bracket {
            position: relative;
            display: flex;
            flex-direction: column;
            border-radius: 5px;
            gap: 5px;
        }

        .team {

            width: 200px;
            padding: 1rem;
            background: #1e1e1e;
            border-radius: 5px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.7);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .team.winner {
            background: var(--orange);
        }

        .team span {
            font-family: 'Roboto', sans-serif;
            font-size: 0.9rem;
            display: block;
            color: rgba(255, 255, 255, 0.5);
        }

        .connector-up,
        .connector-down,
        .connector-final {
            position: absolute;
            width: 8rem;
            height: 50%;
            right: -8rem;
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-left: none;
        }

        .connector-up {
            border-bottom: none;
            top: 50%;
        }

        .connector-down {
            border-top: none;
            top: 0;
        }

        .connector-final {
            display: none;
        }

        .trophy {
            font-size: 4rem;
            margin-top: 1rem;
            text-align: center;
            animation: float 2s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .final-winner {
            background: var(--orange);
            padding: 1rem;
            border-radius: 5px;
            text-align: center;
            font-weight: normal;
            margin-bottom: 1rem;
            width: 200px;
        }

        .round {
            margin-top: 2rem;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: #1e1e1e;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        .round h3 {
            font-size: 1.5rem;
            text-align: center;
            margin-bottom: 10px;
        }

        .match {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #252525;
            padding: 10px 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            color: white;
        }

        .match .vs {
            font-family: 'Pong War', 'Roboto', sans-serif;
            color: #00bcd4;
            font-weight: bold;
            font-size: 1rem;
        }

        button {
            padding: 10px 10px;
            font-family: "Pong War";
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

    function createTeam(name, score = null, isWinner = false) {
        const team = document.createElement('div');
        team.className = `team ${isWinner ? 'winner' : ''}`;
        team.innerHTML = `${name} ${score !== null ? `<span>Score: ${score}</span>` : ''}`;
        return team;
    }

    function createMatch(match, position, isCurrent = false) {
        const matchContainer = document.createElement('div');
        matchContainer.className = 'match-bracket';
        if (isCurrent) {
            matchContainer.style.border = '4px solid green';
        }
        if (!match) {
            const winner1 = createTeam("winner 1");
            const winner2 = createTeam("winner 2");

            winner1.style.color = 'rgba(104, 104, 104, 0.7)';
            winner2.style.color = 'rgba(104, 104, 104, 0.7)';

            matchContainer.appendChild(winner1);
            matchContainer.appendChild(winner2);              
            return matchContainer;
        }
        matchContainer.appendChild(createTeam(match.player1, match.scores?.[0] ?? null, match.player1 === match.winner));
        if (match.player2) {
            matchContainer.appendChild(createTeam(match.player2, match.scores?.[1] ?? null, match.player2 === match.winner));	
        }   
        else{
            const winner2 = createTeam("winner 2");
            winner2.style.color = 'rgba(104, 104, 104, 0.7)';
            matchContainer.appendChild(winner2);
            return matchContainer;
        }

        const connector = document.createElement('div');
        connector.className = `connector-${position}`;
        matchContainer.appendChild(connector);

        return matchContainer;
    }

    const container = document.createElement('div');
    container.className = 'tournament-container';

    const title = document.createElement('h2');
    title.className = 'bracket-title';
    title.textContent = 'Tournament';

    const content = document.createElement('div');
    content.className = 'bracket-content';

    const round1 = document.createElement('div');
    round1.className = 'round-bracket';

    const round2 = document.createElement('div');
    round2.className = 'round-bracket';

    const finalColumn = document.createElement('div');
    const winner = document.createElement('div');
    winner.className = 'final-winner';
    winner.textContent = 'Winner';
    winner.style.color = 'rgba(255, 255, 255, 0.7)';

    const trophy = document.createElement('div');
    trophy.className = 'trophy';
    trophy.textContent = '🏆';

    finalColumn.appendChild(winner);
    finalColumn.appendChild(trophy);

    const CurrentRound = document.createElement('div');
    if (currentMatch <= 3) {
        CurrentRound.classList.add('round');
        CurrentRound.innerHTML = `
            <h3>Round ${currentMatch}</h3>
            <div class="match">
                <span>${matches[currentMatch - 1].player1}</span>
                <span class="vs">VS</span>
                <span>${matches[currentMatch - 1].player2}</span>
            </div>
        `;
    }
    // Dynamically populate matches
    if (!matches[2]) {
        round1.appendChild(createMatch(matches[0], 'up', currentMatch === 1));	
        round1.appendChild(createMatch(matches[1], 'down', currentMatch === 2));
        round2.appendChild(createMatch(null, 'final', currentMatch === 3));
    } else {
        round1.appendChild(createMatch(matches[0], 'up', currentMatch === 1));
        round1.appendChild(createMatch(matches[1], 'down', currentMatch === 2));
        round2.appendChild(createMatch(matches[2], 'final', currentMatch === 3));
        winner.textContent = matches[2].winner ? matches[2].winner : 'Winner';
        console.log(matches[2].winner);
    }

    // Add buttons start and back

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'space-between';
    buttons.style.marginTop = '2rem';

    const startButton = document.createElement('button');
    startButton.textContent = 'Start Tournament';
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'cancel';

    if (currentMatch > 3) {
        startButton.style.display = 'none';
        startButton.disabled = true;
    }

    buttons.appendChild(cancelButton);
    buttons.appendChild(startButton);


    // Event listeners
    startButton.addEventListener('click', () => {

        console.log('start match');

        
            ws.send(JSON.stringify({ type: 'countdown' }));
    });

    cancelButton.addEventListener('click', () => {
        ws.send(JSON.stringify({ type: 'cancel' }));
        ws.close();
        render(menu(), document.body.querySelector('game-page').shadowRoot.querySelector('.game-page'));
    });

    content.appendChild(round1);
    content.appendChild(round2);
    content.appendChild(finalColumn);

    container.appendChild(style);
    container.appendChild(title);
    container.appendChild(content);
    if (currentMatch <= 3) {
        container.appendChild(CurrentRound);
    }
    container.appendChild(buttons);

    return container;
}
