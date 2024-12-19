import { render } from "./render.js";
import { menu } from "./loby.js";

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

.start {
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
.start:hover {
    background-color: gray;
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
#tournament_name, #alias {
    padding: 10px 10px;
    border: 1px solid var(--blue);
    border-radius: 5px;
    display: block;
    width: 60%;
    margin: 10px 0px 10px ;
}

`;

let tournaments = [];


function createHeaders(headers, create_tournament, join_tournament){
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
    };
    
    tournament_sections.appendChild(create_button);
    tournament_sections.appendChild(join_button);
    headers.appendChild(tournament_title);
    headers.appendChild(tournament_sections);
    // finish headers
}

function createCreateTournament(create_tournament){
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

    buttons.style.justifyContent = 'space-between';
    start.textContent = "Create";
    back.textContent = "Back";
    start.classList.add('start');
    back.classList.add('start');
    
    start.addEventListener( 'click', () => {
        const aliasValue = alias.value.trim();
        const tournamentValue = tournament_name.value.trim();
        
        if (!aliasValue || !tournamentValue) {
            alert('Please fill out all fields.');
            return;
        }
        alert(`Tournament "${tournamentValue}" created by ${aliasValue}!`);
    });

    back.addEventListener( 'click', () => {
        render(menu(), document.body);
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
    list.innerHTML = '';
    if (tournaments.length === 0) {
        const noTournamentsItem = document.createElement('li');
        noTournamentsItem.textContent = 'No tournaments available';
        noTournamentsItem.style.color = '#aaa'; // Gray text for "no tournaments"
        list.appendChild(noTournamentsItem);
    }
}

function createJoinTournament(join_tournament){
    // create tournament Section

    const listLable = document.createElement('label');
    const list = document.createElement('ul');
    const aliasLabel = document.createElement('label');
    const alias = document.createElement('input');
    const join = document.createElement('button');
    const back = document.createElement('button');
    const buttons = document.createElement('div');

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
    join.classList.add('start');
    join.addEventListener( 'click', () => {
        const aliasValue = alias.value.trim();


        if (!aliasValue || !selectedTournament) {
            alert('Please fill out all fields.');
            return;
        }
        alert(`You (${aliasValue}) joined the tournament "${selectedTournament.name}"!`);
    });

    back.addEventListener( 'click', () => {
        render(menu(), document.body);
    });

    availabe(list);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(aliasLabel);
    fragment.appendChild(alias);

    buttons.style.alignItems = 'space-between';
    buttons.appendChild(join);
    buttons.appendChild(back);
    
    join_tournament.appendChild(fragment);
    join_tournament.appendChild(aliasLabel);
    join_tournament.appendChild(alias);
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


    createHeaders(headers, create_tournament, join_tournament);
    createCreateTournament(create_tournament);
    createJoinTournament(join_tournament);

    tournament.appendChild(style);
    tournament.appendChild(headers);
    tournament.appendChild(create_tournament);
    tournament.appendChild(join_tournament);
    return tournament;
}
