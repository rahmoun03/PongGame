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
    transition: 0.5s ease;
}
.create_button:hover, .join_button:hover {
    color: var(--red);
}
`;

const tournament = document.createElement('div');
const headers = document.createElement('div');
const create_tournament = document.createElement('div');
const join_tournament = document.createElement('div');

tournament.classList.add('tournament');
headers.classList.add('headers');
create_tournament.classList.add('create_tournament');
join_tournament.classList.add('join_tournament');


// headers 
headers.textContent = "Tournament";
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
    };
    join_button.onclick = () => {
        join_button.style.color = 'var(--red)';
        create_button.style.color = 'gray';
    };

tournament_sections.appendChild(create_button);
tournament_sections.appendChild(join_button);
headers.appendChild(tournament_sections);

export function tournamentPage(){
    tournament.appendChild(style);
    tournament.appendChild(headers);
    tournament.appendChild(create_tournament);
    tournament.appendChild(join_tournament);
    return tournament;
}
