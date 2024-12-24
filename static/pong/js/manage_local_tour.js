import { render } from "./render.js";
import { menu } from "./loby.js";
import { tournamentBracket } from "./bracket.js";

export function manageLocalTournament(participants, tournamentName) {
    URL = 'ws://'+window.location.host+'/ws/tournament/local/';
    let ws = new WebSocket(URL);
    
    ws.onopen = function(event) {
        console.log('Connected to websocket');
        ws.send(JSON.stringify({
            type: 'join',
            participants: participants,
            name: tournamentName
        }));
    }

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.table(data);
        if (data.type === 'joined') {
            console.log('Joined tournament');
            render(
                tournamentBracket(
                    data.matches,
                    data.round,
                    ws
                ),
                document.body.querySelector('game-page').shadowRoot.querySelector('.game-page'));
        }
        if (data.type === 'update') {
            console.log('Update tournament');
            render(
                tournamentBracket(
                    data.matches,
                    data.round,
                    ws
                ),
                document.body.querySelector('game-page').shadowRoot.querySelector('.game-page'));
        }
    }

    ws.onerror = function(event) {
        console.log('Error with websocket');
    }

    ws.onclose = function(event) {
        console.log('Disconnected from websocket');
    }
}