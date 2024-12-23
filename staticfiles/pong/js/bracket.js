export function tournamentBracket(teams) {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
.tournament-bracket {
    display: flex;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.rounds {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    margin-right: 40px;
}

.match {
    display: flex;
    flex-direction: column;
    margin: 10px 0;
    position: relative;
}

.team {
    border: 1px solid #ccc;
    padding: 10px;
    width: 150px;
    background: #f5f5f5;
    position: relative;
}

.team:first-child {
    border-bottom: none;
}

.team.winner {
    background: #e6ffe6;
}

.connector {
    position: absolute;
    right: -40px;
    top: 50%;
    width: 40px;
    height: 2px;
    background: #ccc;
}

.round-2 .match {
    margin-top: 50px;
}

.trophy {
    align-self: center;
    font-size: 24px;
    margin-left: 20px;
}
`;

    // Function to create a team element
    function createTeam(name, isWinner) {
        const team = document.createElement('div');
        team.className = `team ${isWinner ? 'winner' : ''}`;
        team.textContent = name;
        return team;
    }

    // Function to create a match element
    function createMatch(team1, team2, winner) {
        const match = document.createElement('div');
        match.className = 'match';

        match.appendChild(createTeam(team1, team1 === winner));
        match.appendChild(createTeam(team2, team2 === winner));

        const connector = document.createElement('div');
        connector.className = 'connector';
        match.appendChild(connector);

        return match;
    }

    // Create tournament bracket container
    const tournamentContainer = document.createElement('div');
    tournamentContainer.className = 'tournament-bracket';

    // Create rounds
    const roundsContainer1 = document.createElement('div');
    roundsContainer1.className = 'rounds round-1';

    roundsContainer1.appendChild(createMatch(teams[0], teams[1], teams[1]));
    roundsContainer1.appendChild(createMatch(teams[2], teams[3], teams[2]));

    const roundsContainer2 = document.createElement('div');
    roundsContainer2.className = 'rounds round-2';

    roundsContainer2.appendChild(createMatch(teams[1], teams[2], teams[2]));

    // Trophy
    const trophy = document.createElement('div');
    trophy.className = 'trophy';
    trophy.textContent = '🏆';

    // Append everything
    tournamentContainer.appendChild(style);
    tournamentContainer.appendChild(roundsContainer1);
    tournamentContainer.appendChild(roundsContainer2);
    tournamentContainer.appendChild(trophy);

    return tournamentContainer;
}
