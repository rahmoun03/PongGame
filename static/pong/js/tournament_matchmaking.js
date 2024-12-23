const style = document.createElement('style');
style.textContent = `
#matchmaking-section {
    font-family: 'Roboto', sans-serif;
    width: 90%;
    // height: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    justify-content: center;
}

.section {
    background: #252525;
    padding: 20px;
    border-radius: 8px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
}

.section h2 {
    font-family: 'Roboto', sans-serif;
    space-letter: 3px;
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
    font-size: 1.5rem;
    margin-bottom: 10px;
    color: var(--red);
}

.participants {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

.participant-card {
    color: white;
    background: #252525;
    padding: 15px;
    text-align: center;
    border-radius: 8px;
    border: 2px solid transparent;
    transition: 0.5s;
}
    
.default {
    color: rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.5);
    padding: 15px;
    text-align: center;
    border-radius: 8px;
    border: 2px solid transparent;
    transition: 0.3s;
}

.participant-card:hover {
    border: 2px solid #00bcd4;
}

.participant-card span {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
}



.tournament-bracket {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
}

.round {
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: #1e1e1e;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    width: 100%;
}

.round h3 {
    font-size: 1.5rem;
    color: #ff5722;
    text-align: center;
    margin-bottom: 10px;
}

.match {
    display: flex;
    justify-content: space-around;
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

`;


export function matchmakingPage(alias, tournamentName) {
    // Mock database for participants and matches
    let round = 2;
    let participants = [
    ];
    let matches = [
        {
        }
    ];

    console.log('alias: ', alias);
    console.log('tournamentName: ', tournamentName);

    // Create the matchmaking section
    const matchmakingSection = document.createElement('div');
    matchmakingSection.id = 'matchmaking-section';
    matchmakingSection.classList.add('section');
    
    // Create the participants section
    const participantsSection = document.createElement('div');
    participantsSection.classList.add('section');
    participantsSection.innerHTML = `
        <h2>Participants</h2>
        <div class="participants"></div>
    `;
    const participantsList = participantsSection.querySelector('.participants');
    

    // tournmanet map section
    const tournamentProgressSection = document.createElement('div');
    tournamentProgressSection.classList.add('section');
    tournamentProgressSection.innerHTML = `
        <h2>Tournament map</h2>
        <div class="tournament-bracket"></div>
    `;
    const bracketContainer = tournamentProgressSection.querySelector('.tournament-bracket');


    // create default the participants list
    function createParticipantList() {
        participantsList.innerHTML = '';
        for(let i = 0; i < 4; i++){
            if (participants[i]) {
                const participantCard = document.createElement('div');
                participantCard.classList.add('participant-card');
                participantCard.innerHTML = `
                    <span>${participants[i]}</span>
                `;
                participantsList.appendChild(participantCard);
            }
            else{
                const participantCard = document.createElement('div');
                participantCard.classList.add('default');
                participantCard.innerHTML = `
                    <span>No PLayer</span>
                `;
                participantsList.appendChild(participantCard);
            }
        }
    }


    // Create the tournament bracket
    function createTournamentProgress() {
        bracketContainer.innerHTML = '';

        // Round 1
        const round1 = document.createElement('div');
        round1.classList.add('round');
        round1.innerHTML = `
            <h3>Round 1</h3>`;
        for (let i = 0; i < 2; i++) {
            const match = matches[i];
            const matchElement = document.createElement('div');
            matchElement.classList.add('match');
            if (!match) {
                matchElement.innerHTML = `
                    <span>Waiting for players</span>
                `;
                matchElement.style.justifyContent = 'center';
                matchElement.style.textAlign = 'center';
                matchElement.style.color = 'rgba(255, 255, 255, 0.5)';
                round1.appendChild(matchElement);
                continue;
            }
            else if (!match.player1 || !match.player2) {
                matchElement.innerHTML = `
                    <span>Waiting for players</span>
                `;
                matchElement.style.justifyContent = 'center';
                matchElement.style.textAlign = 'center';
                matchElement.style.color = 'rgba(255, 255, 255, 0.5)';
                round1.appendChild(matchElement);
                continue;
            }
            else {
                matchElement.innerHTML = `
                    <span>${match.player1}</span>
                    <span class="vs">VS</span>
                    <span>${match.player2}</span>
                `;
            }
            round1.appendChild(matchElement);
        }
        bracketContainer.appendChild(round1);

        // Final Round
        const finalRound = document.createElement('div');
        finalRound.classList.add('round');
        finalRound.innerHTML = `
            <h3>Final</h3>
            <div class="match">
                <span>Winner of Match 1</span>
                <span class="vs">VS</span>
                <span>Winner of Match 2</span>
            </div>
        `;
        bracketContainer.appendChild(finalRound);

        // Append the bracket to the tournament map section
        tournamentProgressSection.appendChild(bracketContainer);
    }

    // generate matches
    function generateMatches() {
        matches = [];
        console.table(participants);
        for (let i = 0; i < participants.length; i += 2) {
            if (participants[i + 1]) {
                
                matches.push({
                    player1: participants[i],
                    player2: participants[i + 1],
                });
            }
            else {
                matches.push({
                    player1: participants[i]
                });
                return;
            }
        }
    }


    // Update the participants list

    createParticipantList();
    createTournamentProgress();




    URL = 'ws://'+window.location.host+'/ws/tournament/matchmaking/';
    let ws = new WebSocket(URL);

    ws.onopen = function(event) {
        console.log('Connected to websocket');
    
        ws.send(JSON.stringify({
            type: 'join',
            name: tournamentName, 
            alias: alias
        }));
    }

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.type === 'update') {
            participants = data.participants;
            generateMatches();
            console.table(matches);
            createParticipantList();
            createTournamentProgress();
        }

    }

    ws.onclose = function(event) {
        console.log('Disconnected from websocket');
    }




    matchmakingSection.appendChild(style);
    matchmakingSection.appendChild(participantsSection);
    matchmakingSection.appendChild(tournamentProgressSection);
    return matchmakingSection;
}