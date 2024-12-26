import { render } from "./render.js";
import { menu } from "./loby.js";
import { matchmakingPage } from "./tournament_matchmaking.js";

const style = document.createElement('style');
style.textContent = `
.tournament {
    display: flex;
    flex-direction: column;
    color: white;
    font-family: "Pong War";
    letter-spacing: 2px;
    position: absolute;
    width: 50%;
    max-height: 50%;
    margin: 20px auto;
    padding: 20px;
    border-radius: 5px;
    background: var(--blue);
    transition:  0.5s ease;
}
.tournament .hidden {
    display: none;
}

#error-popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--red);
  color: white;
  padding: 20px;
  border-radius: 5px;
  border: 1px solid white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  text-align: center;
}

.headers {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.tournament_title {
    font-family: "Pong War";
    transition: 0.3s ease;
}
.tournament_sections {
    display: flex;
    flex-direction: row;
    gap: 10px;
}
.create_button, .join_button {
    font-family: "Pong War";
    letter-spacing: 2px;
    color: gray;
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: 0.3s ease;
}
.create_button:hover, .join_button:hover {
    color: var(--red);
}

.create_tournament, .join_tournament {
    height: 100%;
    width: 100%;
}

.start, .join, .back , .close{
    width: 20%;
    location: end;
    font-family: "Pong War";
    padding: 10px 10px;
    letter-spacing: 2px;
    color: white;
    background-color: var(--red);
    border: 1px solid white;
    border-radius: 5px;
    cursor: pointer;
    transition: 0.3s ease;
}
.start:hover, .join:hover, .back:hover, .close:hover {
    background-color: gray;
}

.close {
    width: fit-content;
}

#list {
    list-style: none;
    max-height: 80px;
    width: 100%;
    overflow-y: auto;
    border: 1px solid var(--blue);
    border-radius: 5px;
    padding: 10px;
    margin: 10px 0px 10px ;
}

#list li {
    padding: 10px;
    margin-bottom: 5px;
    background-color: var(--blue);
    color: white;
    border-radius: 5px;
    cursor: pointer;
}

#list li:hover {
    background-color: var(--red);
}

#list li.selected {
    background-color: var(--red);
    color: white;
}

#tournament_name, #alias {
    padding: 10px 10px;
    border: 1px solid var(--blue);
    border-radius: 5px;
    display: block;
    width: 60%;
    margin: 10px 0px 10px ;
}
#list::-webkit-scrollbar {
    width: 6px; /* Narrow scrollbar for a mobile-like feel */
}

#list::-webkit-scrollbar-thumb {
    background: var(--red); /* Thumb color */
    border-radius: 10px; /* Rounded thumb for a smooth look */
}

#list::-webkit-scrollbar-thumb:hover {
    background: #fff; /* Darker color on hover */
}

#list::-webkit-scrollbar-track {
    background: transparent; /* Transparent track for minimalistic style */
}
`;

let tournaments = [];
let User = 'arahmoun';

function popup(error_popup) {

    const error_message = document.createElement('p');
    error_message.id = 'error-message';

    const close = document.createElement('button');
    close.classList.add('close');
    close.textContent = 'Close';
    close.addEventListener('click', () => {
        error_popup.classList.add('hidden');
    });
    error_popup.appendChild(error_message);
    error_popup.appendChild(close);
}

function showErrorPopup(message, error_popup) {
    const messageElement = error_popup.querySelector('p');

    console.log('showErrorPopup', messageElement);
    messageElement.textContent = message;
    error_popup.classList.remove('hidden');
}

function createHeaders(headers, create_tournament, join_tournament, ws){
    // headers 
    // title
    const tournament_title = document.createElement('h5');
    tournament_title.classList.add('tournament_title');
    tournament_title.textContent = "Create Tournament";
    
    // buttons
    const tournament_sections = document.createElement('div');
    tournament_sections.classList.add('tournament_sections');
    /// create button
    const create_button = document.createElement('button');
    create_button.classList.add('create_button');
    create_button.textContent = "Create";
    create_button.style.color = 'var(--red)';
    
    /// join button
    const join_button = document.createElement('button');
    join_button.classList.add('join_button');
    join_button.textContent = "Join";

    
    create_button.onclick = () => {
        create_button.style.color = 'var(--red)';
        join_button.style.color = 'gray';
        tournament_title.textContent = "Create Tournament";
        create_tournament.style.display = 'block';
        join_tournament.style.display = 'none';
        
    };
    join_button.onclick = () => {
        join_button.style.color = 'var(--red)';
        create_button.style.color = 'gray';
        tournament_title.textContent = "join Tournament";
        create_tournament.style.display = 'none';
        join_tournament.style.display = 'block';
        ws.send(JSON.stringify({
            type: 'update'
        }));
        availabe(join_tournament.querySelector('ul'));
    };
    
    tournament_sections.appendChild(create_button);
    tournament_sections.appendChild(join_button);
    headers.appendChild(tournament_title);
    headers.appendChild(tournament_sections);
    // finish headers
}

function createCreateTournament(create_tournament, ws){
    // create tournament Section

    const form = document.createElement('form');
    const aliasLabel = document.createElement('label');
    const alias = document.createElement('input');
    const tournament_name = document.createElement('input');
    const tournament_name_label = document.createElement('label');
    const start = document.createElement('button');
    const back = document.createElement('button');
    const buttons = document.createElement('div');
    
    form.classList.add('form');

    aliasLabel.textContent = "Alias Name :";
    aliasLabel.setAttribute('for', 'alias');
    alias.setAttribute('type', 'text');
    alias.setAttribute('id', 'alias');
    alias.setAttribute('placeholder', 'Enter your Alias');
    alias.setAttribute('required', 'true');

    tournament_name_label.textContent = "Tournament Name :";
    tournament_name_label.setAttribute('for', 'tournament_name');
    tournament_name.setAttribute('type', 'text');
    tournament_name.setAttribute('id', 'tournament_name');
    tournament_name.setAttribute('placeholder', 'Enter Tournament Name');
    tournament_name.setAttribute('required', 'true');

    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'space-between';
    start.textContent = "Create";
    back.textContent = "Back";
    start.classList.add('start');
    back.classList.add('back');
    
    start.addEventListener( 'click', () => {
        const aliasValue = alias.value.trim();
        const tournamentValue = tournament_name.value.trim();
        
        if (!aliasValue || !tournamentValue) {
            // alert('Please fill out all fields.');
            return;
        }

        let context = JSON.stringify({
            type: 'create',
            name: tournamentValue,
            creator: aliasValue,
            creator_username: User
        });
        ws.send(context);
        alias.value = '';
        tournament_name.value = '';
    });

    back.addEventListener( 'click', () => {
        ws.close();
        render(menu(), document.body.querySelector('.game-page').shadowRoot.querySelector('.game-page'));
    });

    const fragment = document.createDocumentFragment();
    fragment.appendChild(aliasLabel);
    fragment.appendChild(alias);
    
    buttons.appendChild(start);
    buttons.appendChild(back);
    form.appendChild(fragment);
    form.appendChild(tournament_name_label);
    form.appendChild(tournament_name);
    form.appendChild(buttons);
    create_tournament.appendChild(form);
}

function availabe(list){
    console.log('availabe');
    list.innerHTML = '';
    if (tournaments.length === 0) {
        const noTournamentsItem = document.createElement('li');
        noTournamentsItem.textContent = 'No tournaments available';
        noTournamentsItem.style.color = '#aaa'; // Gray text for "no tournaments"
        list.appendChild(noTournamentsItem);
    } else {
        tournaments.forEach((tournament, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${tournament.name} (by ${tournament.creator})`;
            listItem.dataset.index = index; // Store the tournament index
            list.appendChild(listItem);

            listItem.addEventListener('click', () => {
                list.querySelectorAll('li').forEach(listItem => {
                    listItem.classList.remove('selected');
                });
                listItem.classList.add('selected');
                console.log(`Selected tournament: ${tournament.name}`);
            });
            list.appendChild(listItem);
        });
    }
}

function createJoinTournament(join_tournament, ws){
    // create tournament Section

    const listLable = document.createElement('label');
    const list = document.createElement('ul');
    const aliasLabel = document.createElement('label');
    const alias = document.createElement('input');
    const join = document.createElement('button');
    const back = document.createElement('button');
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'space-between';

    listLable.textContent = "Available Tournaments :";
    listLable.setAttribute('for', 'list');
    list.setAttribute('id', 'list');
    
    aliasLabel.textContent = "Alias Name :";
    aliasLabel.setAttribute('for', 'alias');
    alias.setAttribute('id', 'alias');
    alias.setAttribute('type', 'text');
    alias.setAttribute('placeholder', 'Enter your Alias');
    alias.setAttribute('required', 'true');


    join.textContent = "Join";
    back.textContent = "Back";
    join.classList.add('join');
    back.classList.add('back');

    availabe(list);
    
    join.addEventListener( 'click', () => {
        const aliasValue = alias.value.trim();
        let index = list.querySelector('li.selected').dataset.index;
        let selectedTournament = tournaments[index];


        if (!aliasValue || !selectedTournament) {
            // alert('Please fill out all fields.');
            return;
        }
        let context = JSON.stringify({
            type: 'join',
            name: selectedTournament.name,
            player: aliasValue
        });
        ws.send(context);
    });

    back.addEventListener( 'click', () => {
        ws.close();
        render(menu(), document.body.querySelector('.game-page').shadowRoot.querySelector('.game-page'));
    });


    const fragment = document.createDocumentFragment();
    fragment.appendChild(aliasLabel);
    fragment.appendChild(alias);
    buttons.appendChild(join);
    buttons.appendChild(back);
    
    join_tournament.appendChild(listLable);
    join_tournament.appendChild(list);
    join_tournament.appendChild(fragment);
    join_tournament.appendChild(buttons);
}


export function tournamentPage(){
    const tournament = document.createElement('div');
    const headers = document.createElement('div');
    const create_tournament = document.createElement('div');
    const join_tournament = document.createElement('div');
    join_tournament.style.display = 'none'; 
    
    tournament.classList.add('tournament');
    headers.classList.add('headers');
    create_tournament.classList.add('create_tournament');
    join_tournament.classList.add('join_tournament');    

    const error_popup = document.createElement('div');
    error_popup.id = 'error-popup';
    error_popup.classList.add('hidden');



    const ws_URL = 'ws://'+window.location.host+'/ws/setupTournament/remoute/';
    const ws = new WebSocket(ws_URL);

    ws.onopen = () => {
        console.log('connected');

        createHeaders(headers, create_tournament, join_tournament, ws);
        createCreateTournament(create_tournament, ws);
        createJoinTournament(join_tournament, ws);
        popup(error_popup);

        tournament.appendChild(style);
        tournament.appendChild(headers);
        tournament.appendChild(create_tournament);
        tournament.appendChild(join_tournament);
        tournament.appendChild(error_popup);
        
        ws.send(JSON.stringify({
            type: 'update'
        }));
    };
    ws.onmessage = (event) => {
        let data = JSON.parse(event.data);
        console.table(data);
        if (data.type === 'update'){
            tournaments = data.tournaments;
            availabe(join_tournament.querySelector('ul'));
        }
        if (data.type === 'joined'){
            console.log('joined');
            console.log(data);
            ws.close();
            render(matchmakingPage(data.player, data.name), document.body.querySelector('.game-page').shadowRoot.querySelector('.game-page'));
        }
        if (data.type === 'created'){
            console.log('created');
            console.log(data);
            ws.close();
            render(matchmakingPage(data.creator, data.name), document.body.querySelector('.game-page').shadowRoot.querySelector('.game-page'));
        }
        if (data.type === 'error'){
            console.log('error');
            console.log(data.message);
            showErrorPopup(data.message, error_popup);
        }
    };
    ws.onerror = (event) => {
        console.log(event);
    };
    ws.onclose = () => {
        console.log('disconnected');
    };

    return tournament;
}
