window.matchmaking = function (alias, tournamentName) {
    // Mock database for participants and matches
    let participants = [];
    let matches = [];

    URL = 'ws://'+window.location.host+'/ws/tournament/';
    let ws = new WebSocket(URL);

    ws.onopen = function(event) {
        console.log('Connected to websocket');
        ws.send(JSON.stringify({
            type: 'join',
            tournamentName: tournamentName, 
            alias: alias
        }));
    }

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        console.log(message);
        if (message.type === 'tournament_list') {
            participants.push(message.alias);
            updateParticipantList();
        }
    }

    ws.onclose = function(event) {
        console.log('Disconnected from websocket');
    }


    const participantsList = document.getElementById('participants');
    const matchesList = document.getElementById('matches');
    const matchmakingSection = document.getElementById('matchmaking-section');

    // Simulate adding a participant
    // function addParticipant(alias) {
    //     participants.push(alias);
    //     updateParticipantList();
    //     generateMatches();
    // }

    // Update the participant list UI
    function updateParticipantList() {
        participantsList.innerHTML = '';
        participants.forEach(participant => {
            const listItem = document.createElement('li');
            listItem.textContent = participant;
            participantsList.appendChild(listItem);
        });
    }

    // Generate matches dynamically
    function generateMatches() {
        matches.length = 0; // Clear previous matches

        // Pair participants
        const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5); // Shuffle
        for (let i = 0; i < shuffledParticipants.length; i += 2) {
            if (shuffledParticipants[i + 1]) {
                matches.push(`${shuffledParticipants[i]} vs ${shuffledParticipants[i + 1]}`);
            } else {
                matches.push(`${shuffledParticipants[i]} gets a bye`);
            }
        }

        updateMatchesList();
    }
    // Update the matches UI
    function updateMatchesList() {
        matchesList.innerHTML = '';
        matches.forEach(match => {
            const matchItem = document.createElement('li');
            matchItem.textContent = match;
            matchesList.appendChild(matchItem);
        });
    }
}