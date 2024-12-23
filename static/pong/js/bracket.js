export function tournamentBracket(
    teams = ['Team 1', 'Team 2', 'Team 3', 'Team 4'],
    results = null
) {
    const style = document.createElement('style');
    style.textContent = `
        .tournament-container {
            padding: 2rem;
            background: #252525;
            border-radius: 1rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
        }

        .bracket-title {
            font-size: 1.875rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2rem;
            color: white;
        }

        .bracket-content {
            display: flex;
            align-items: center;
            gap: 4rem;
        }

        .round {
            display: flex;
            flex-direction: column;
            gap: 4rem;
        }

        .match {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .team {
            width: 200px;
            padding: 1rem;
            background: #1e1e1e;
            border-radius: 5px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.7);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .team.winner {
            background: var(--orange);
            font-weight: bold;
        }

        .team span {
            font-size: 0.9rem;
            display: block;
            color: rgba(255, 255, 255, 0.5);
        }

        .connector-up,
        .connector-down,
        .connector-final {
            position: absolute;
            width: 8rem;
            height: 50%;
            right: -8rem;
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-left: none;
        }

        .connector-up {
            border-bottom: none;
            top: 50%;
        }

        .connector-down {
            border-top: none;
            top: 0;
        }

        .connector-final {
            display: none;
        }

        .trophy {
            font-size: 4rem;
            margin-top: 1rem;
            text-align: center;
            animation: float 2s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .final-winner {
            background: var(--orange);
            padding: 1rem;
            border-radius: 0.5rem;
            text-align: center;
            font-weight: bold;
            margin-bottom: 1rem;
            width: 200px;
        }
    `;

    function createTeam(name, score = null, isWinner = false) {
        const team = document.createElement('div');
        team.className = `team ${isWinner ? 'winner' : ''}`;
        team.innerHTML = `${name} ${score !== null ? `<span>Score: ${score}</span>` : ''}`;
        return team;
    }

    function createMatch(team1, team2, winner, scores, round) {
        const match = document.createElement('div');
        match.className = 'match';

        match.appendChild(createTeam(team1, scores?.[0] ?? null, team1 === winner));
        match.appendChild(createTeam(team2, scores?.[1] ?? null, team2 === winner));

        const connector = document.createElement('div');
        connector.className = `connector-${round}`;
        match.appendChild(connector);

        return match;
    }

    const container = document.createElement('div');
    container.className = 'tournament-container';

    const title = document.createElement('h2');
    title.className = 'bracket-title';
    title.textContent = 'Tournament Bracket';

    const content = document.createElement('div');
    content.className = 'bracket-content';

    const round1 = document.createElement('div');
    round1.className = 'round';

    const round2 = document.createElement('div');
    round2.className = 'round';

    const finalColumn = document.createElement('div');
    const winner = document.createElement('div');
    winner.className = 'final-winner';
    winner.textContent = 'Winner';
    winner.style.color = 'rgba(255, 255, 255, 0.7)';

    const trophy = document.createElement('div');
    trophy.className = 'trophy';
    trophy.textContent = '🏆';

    finalColumn.appendChild(winner);
    finalColumn.appendChild(trophy);

    // Dynamically populate matches
    if (!results) {
        round1.appendChild(createMatch(teams[0], teams[1], null, null, 'up'));
        round1.appendChild(createMatch(teams[2], teams[3], null, null, 'down'));
        round2.appendChild(createMatch('', '', null, null, 'final'));
    } else {
        round1.appendChild(createMatch(teams[0], teams[1], results.round1[0]?.winner, results.round1[0]?.scores, 'up'));
        round1.appendChild(createMatch(teams[2], teams[3], results.round1[1]?.winner, results.round1[1]?.scores, 'down'));
        round2.appendChild(createMatch(results.round1[0]?.winner, results.round1[1]?.winner, results.final?.winner, results.final?.scores, 'final'));
        winner.textContent = results.final?.winner || 'Winner';
    }

    content.appendChild(round1);
    content.appendChild(round2);
    content.appendChild(finalColumn);

    container.appendChild(style);
    container.appendChild(title);
    container.appendChild(content);

    return container;
}
