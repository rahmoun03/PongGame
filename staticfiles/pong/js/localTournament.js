import { render } from "./render.js";
import { menu } from "./loby.js";
import { manageLocalTournament } from "./manage_local_tour.js";



export function tournamentlocal() {

    const style = document.createElement('style');
    style.textContent = `
    .tournament {
        display: flex;
        flex-direction: column;
        color: white;
        font-family: "Pong War";
        letter-spacing: 2px;
        position: absolute;
        width: 80%;
        max-width: 600px;
        max-height: 100%;
        margin: 20px auto;
        padding: 20px;
        border-radius: 5px;
        background: var(--blue);
        transition: 0.5s ease;
    }
    .headers {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
    }
    .headers h1 {
        color: var(--orange);
        font-size: 24px;
    }
    .form {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: space-around;
        gap: 10px;
    }
    input {
        padding: 10px;
        border: 1px solid var(--blue);
        border-radius: 5px;
        font-family: "Pong War";
    }
    button {
        padding: 10px 20px;
        font-family: "Pong War";
        color: white;
        background-color: var(--red);
        border: 1px solid white;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.3s ease;
    }
    button:hover {
        background-color: gray;
    }
    `;
    const tournament = document.createElement('div');
    tournament.classList.add('tournament');

    const headers = document.createElement('div');
    headers.classList.add('headers');
    const title = document.createElement('h1');
    title.textContent = "Local Tournament Registration";
    headers.appendChild(title);

    const form = document.createElement('form');
    form.classList.add('form');

    // Tournament name input
    const tournamentNameLabel = document.createElement('label');
    tournamentNameLabel.textContent = "Tournament Name:";
    const tournamentNameInput = document.createElement('input');
    tournamentNameInput.setAttribute('type', 'text');
    tournamentNameInput.setAttribute('placeholder', 'Enter Tournament Name');
    tournamentNameInput.required = true;

    // Participant inputs
    const participantInputs = [];
    for (let i = 1; i <= 4; i++) {
        const label = document.createElement('label');
        label.textContent = `Participant ${i}:`;
        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('placeholder', `Enter Participant ${i} Name`);
        input.required = true;
        participantInputs.push(input);
        form.appendChild(label);
        form.appendChild(input);
    }

    // Buttons
    const startButton = document.createElement('button');
    startButton.textContent = "Start Tournament";
    const backButton = document.createElement('button');
    backButton.textContent = "Back";
    backButton.type = 'button';

    // Event listeners
    startButton.addEventListener('click', (event) => {
        console.log('start tournament');
        event.preventDefault(); 
        const tournamentName = tournamentNameInput.value.trim();
        const participants = participantInputs.map(input => input.value.trim());

        if (participants.some(name => !name)) {
            alert('Please fill out all participant names.');
            return;
        }

        console.log({
            tournamentName,
            participants,
        });

        manageLocalTournament(participants, tournamentName);
    });

    backButton.addEventListener('click', () => {
        render(menu(), document.body.querySelector('game-page').shadowRoot.querySelector('.game-page'));
    });

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'space-between';
    buttons.appendChild(backButton);
    buttons.appendChild(startButton);

    form.appendChild(tournamentNameLabel);
    form.appendChild(tournamentNameInput);
    form.appendChild(buttons);

    tournament.appendChild(style);
    tournament.appendChild(headers);
    tournament.appendChild(form);

    return tournament;
}
