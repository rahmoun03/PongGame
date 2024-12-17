// let section;
class GameStart extends HTMLElement {
  public
    section = 0;
    switchButton = new Audio('static/pong/sound/switch.mp3');
    click = new Audio('static/pong/sound/menu-click-89198.mp3');
  // this.section = {this.toggleMultiplayerOptions, this.toggleModes};
  constructor() {
    super();

    // Create Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    // Create container div
    const container = document.createElement('div');
    container.classList.add('game-start-container');

    // Create buttons
    const aiButton = this.createButton('AI Mode');
    const multiplayerButton = this.createButton('Multiplayer'); 
    const onlineButton = this.createButton('Online', 'hidden');
    const localButton = this.createButton('Local', 'hidden');
    // const classicButton = this.createButton('Classic', 'hidden');
    // const starWarButton = this.createButton('StarWar', 'hidden');
    // const timeAttackButton = this.createButton('Time Attack', 'hidden');
    const tournamentButton = this.createButton('Tournament');
    const backButton = this.createButton('Back', 'hidden');
    // const testButton = this.createButton('test');
    
    // Append buttons to container
    container.appendChild(aiButton);
    container.appendChild(multiplayerButton);
    container.appendChild(onlineButton);
    container.appendChild(localButton);
    container.appendChild(tournamentButton);
    container.appendChild(backButton);
    // container.appendChild(classicButton);
    // container.appendChild(starWarButton);
    // container.appendChild(timeAttackButton);
    // container.appendChild(testButton);
    
    
    // Attach styles
    const style = document.createElement('style');
    style.textContent = `
    :host{
      hieght: 30%;
      width : 20%;
    }
    .game-start-container {
      left: 0px;
      width: 100%;
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
    }
    `;

      // Attach everything to the shadow DOM
      shadow.appendChild(style);
      shadow.appendChild(container);
    }

    createButton(text, additionalClass = '') {
      const button = document.createElement('button');
      button.textContent = text;
      if (additionalClass) {
      button.classList.add(additionalClass);
    }

    button.addEventListener('click', () => this.handleButtonClick(text));
    
    button.addEventListener("mouseover", () => {
      console.log("hover button");
      this.switchButton.play();
    });
    return button;
  }


  handleButtonClick(buttonType) {
    this.click.play();
    switch (buttonType) {
      case 'AI Mode':
        this.remove();
        document.getElementById('game-title').style.display = 'none';
        // document.getElementById('spaceship').style.display = 'none';
        window.ai_mode();
        break;
      case 'Multiplayer':
        this.toggleMultiplayerOptions();
        this.section = 1;
        break;
      case 'Online':
        this.section = 2;
        this.remove();
        document.getElementById('game-title').style.display = 'none';
        document.getElementById('waiting').style.display = 'flex';
        window.online_1vs1();
        break;
      case 'Local':
        this.section = 2;
        this.remove();
        // document.getElementById('spaceship').style.display = 'none';
        document.getElementById('CC').style.display = 'none';
        window.local_1vs1();
        break;
      case 'Tournament':
        console.log('Tournament');
        this.section = 1;
        document.getElementById('tournament-section').style.display = "flex";
        window.manage();
        break;
      case 'Back':
        if(this.section == 1)
          this.toggleMultiplayerOptions();
        else if(this.section == 2)
        {
          this.toggleModes();
          this.section = 1;
        }
        break;
    }
    console.log(this.section);
  }

  toggleMultiplayerOptions() {
    this.shadowRoot.querySelector('button:nth-child(5)').classList.toggle('hidden');
    this.shadowRoot.querySelector('button:nth-child(1)').classList.toggle('hidden');
    this.shadowRoot.querySelector('button:nth-child(2)').classList.toggle('hidden');
    this.shadowRoot.querySelector('button:nth-child(3)').classList.toggle('hidden');
    this.shadowRoot.querySelector('button:nth-child(4)').classList.toggle('hidden');
    this.shadowRoot.querySelector('button:nth-child(6)').classList.toggle('hidden');
  }
  toggleModes() {
    this.shadowRoot.querySelector('button:nth-child(3)').classList.toggle('hidden');
    this.shadowRoot.querySelector('button:nth-child(4)').classList.toggle('hidden');
    this.shadowRoot.querySelector('button:nth-child(6)').classList.toggle('hidden');
  }
}

// Define the web component
customElements.define('game-start', GameStart);
