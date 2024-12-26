import { waitingPage } from './waiting.js';
import { render } from './render.js';
import { ai_mode } from './aimode.js';
import { local_1vs1 } from './local_1vs1.js';
import { online_1vs1 } from './online_1vs1.js';
import { tournamentPage } from './tournament.js';
import { tournamentlocal } from './localTournament.js';

let  switchButton = new Audio('static/pong/sound/switch.mp3');
let click = new Audio('static/pong/sound/menu-click-89198.mp3');





export function menu() {
  // Attach styles
  const style = document.createElement('style');
  style.textContent = `
    .menu {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width : 100%;
    }

    .game-title {
      position: absolute;
      top: 50px;
      display: flex;
      font-family: "Pong War", "Freeware";
      font-weight: bold;
      font-size: 120px;
      margin-bottom: 20px;
      text-align: center;
      color: var(--red);
      text-shadow: 2px 0 white, -2px 0 white, 0 2px white, 0 -2px white,
              1px 1px white, -1px -1px white, 1px -1px white, -1px 1px white;

    }
    .game-buttons-container {
      left: 0px;
      width: 20%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    button {
      padding: 10px 10px;
      width: 90%;
      margin-bottom: 10px;
      font-family: "Pong War";
      letter-spacing: 2px;
      color: white;
      background-color: var(--red);
      border: 1px solid white;
      border-radius: 5px;
      cursor: pointer;
      transition: 0.5s ease;
    }
    
    button.hidden {
      display: none;
    }

    button:nth-child(6) {
      background-color: var(--blue);
    }

    button:hover {
      background-color: gray;
  }`;


  let  section = 0;
  const menu = document.createElement('div');
  menu.classList.add('menu');

  // Create container div
  const container = document.createElement('div');
  const title = document.createElement('div');
  container.classList.add('game-buttons-container');
  title.classList.add('game-title');
  title.textContent = "Pong War";

  // Create buttons
  const aiButton = createButton('AI Mode');
  const multiplayerButton = createButton('Multiplayer'); 
  const onlineButton = createButton('Online', 'hidden');
  const localButton = createButton('Local', 'hidden');
  const tournamentButton = createButton('Tournament');
  const backButton = createButton('Back', 'hidden');

  // Append buttons to container
  container.appendChild(aiButton);
  container.appendChild(multiplayerButton);
  container.appendChild(onlineButton);
  container.appendChild(localButton);
  container.appendChild(tournamentButton);
  container.appendChild(backButton);


  
  function createButton(text, additionalClass = '') {
    const button = document.createElement('button');
    button.textContent = text;
    if (additionalClass) {
      button.classList.add(additionalClass);
    }

    button.addEventListener('click', () => handleButtonClick(text));
    
    button.addEventListener("mouseover", () => {
      console.log("hover button");
      switchButton.play();
    });
    return button;
  }

  function handleButtonClick(buttonType) {
    click.play();
    switch (buttonType) {
      case 'AI Mode':
        ai_mode();
        break;
      case 'Multiplayer':
        toggleMultiplayerOptions();
        section = 1;
        break;
      case 'Online':
        section = 2;
        online_1vs1();
        break;
      case 'Local':
        section = 2;
        local_1vs1();
        break;
      case 'Tournament':
        console.log('Tournament');
        section = 1;
        // render(tournamentPage(), document.body.querySelector('game-page').shadowRoot.querySelector('.game-page'));
        render(tournamentlocal(), document.body.querySelector('game-page').shadowRoot.querySelector('.game-page'));
        break;
      case 'Back':
        if(section == 1)
          toggleMultiplayerOptions();
        else if(section == 2)
        {
          toggleModes();
          section = 1;
        }
        break;
    }
    console.log(section);
  }

  function toggleMultiplayerOptions() {
    container.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('hidden'); // Toggle multiplayer options
    });
  }
  
  function toggleModes() {
    container.querySelectorAll('button').forEach((button, index) => {
      if (index == 3 || index == 4 || index == 6) button.classList.toggle('hidden'); // Toggle visibility for modes
    });
  }

  menu.appendChild(style);
  menu.appendChild(title);
  menu.appendChild(container);
  return menu;
}
