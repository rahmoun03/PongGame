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
`;

const tournament = document.createElement('div');
const headers = document.createElement('div');
const create_tournament = document.createElement('div');
const join_tournament = document.createElement('div');

tournament.classList.add('tournament');

export function tournamentPage(){
    tournament.appendChild(style);
    tournament.appendChild(headers);
    tournament.appendChild(create_tournament);
    tournament.appendChild(join_tournament);
    return tournament;
}
