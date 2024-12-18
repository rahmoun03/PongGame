window.manage = function () {
    
    // Mock database for tournaments
    let tournaments = [];

    // Select relevant elements
    const tournamentSection = document.getElementById('tournament-section');
    const createTournament = document.getElementById('create-tournament');
    const joinTournament = document.getElementById('join-tournament');
    const createHeader = document.querySelector('.tournament-feilds h3:nth-child(1)');
    const joinHeader = document.querySelector('.tournament-feilds h3:nth-child(2)');
    const list = document.getElementById('tournament-list');

    // Toggle between Create and Join sections
    createHeader.addEventListener('click', () => {
        createTournament.style.display = 'block';
        joinTournament.style.display = 'none';
        createHeader.style.color = 'var(--red)';
        joinHeader.style.color = 'white';
    });


    joinHeader.addEventListener('click', () => {
        joinTournament.style.display = 'block';
        createTournament.style.display = 'none';
        joinHeader.style.color = 'var(--red)';
        createHeader.style.color = 'white';
    });

    // Handle Create Tournament
    document.getElementById('create-button').addEventListener('click', () => {
        const alias = document.getElementById('create-alias').value.trim();
        const tournamentName = document.getElementById('tournament-name').value.trim();

        if (!alias || !tournamentName) {
            alert('Please fill out all fields.');
            return;
        }
        // Add to tournaments
        tournaments.push({ name: tournamentName, creator: alias });

        matchmakingSection.style.display = 'block';
        window.matchnaking(alias, tournamentName);

        // alert(`Tournament "${tournamentName}" created by ${alias}!`);

        // Reset fields
        document.getElementById('create-alias').value = '';
        document.getElementById('tournament-name').value = '';
        
        // Update tournament list
        updateTournamentList();
    });


    // Handle joining a tournament
    document.getElementById('join-button').addEventListener('click', () => {
        const joinAlias = document.getElementById('join-alias').value.trim();
        const selectedIndex = document.getElementById('join-button').dataset.selectedIndex;

        if (!joinAlias || selectedIndex === undefined) {
            alert('Please select a tournament and enter your alias.');
            return;
        }

        const selectedTournament = tournaments[selectedIndex];

        matchmakingSection.style.display = 'block';
        addParticipant(joinAlias);

        alert(`You (${joinAlias}) joined the tournament "${selectedTournament.name}"!`);

        // Clear alias input
        document.getElementById('join-alias').value = '';
    });



    // Update Tournament Dropdown
    function updateTournamentList() {
        // const list = document.getElementById('tournament-list');
        list.innerHTML = ''; // Clear existing items
    
        if (tournaments.length === 0) {
            const noTournamentsItem = document.createElement('li');
            noTournamentsItem.textContent = 'No tournaments available';
            noTournamentsItem.style.color = '#aaa'; // Gray text for "no tournaments"
            list.appendChild(noTournamentsItem);
            // document.getElementById('join-button').disabled = true; // Disable join button
        } else {
            tournaments.forEach((tournament, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${tournament.name} (by ${tournament.creator})`;
                listItem.dataset.index = index; // Store the tournament index
                list.appendChild(listItem);
    
                // Add click event to select a tournament
                listItem.addEventListener('click', () => {
                    // Remove 'selected' class from all items
                    const allItems = document.querySelectorAll('#tournament-list li');
                    allItems.forEach(item => item.classList.remove('selected'));
                    
                    console.log('selected');
                    
                    // Highlight the selected item
                    listItem.classList.add('selected');
    
                    // Enable the join button
                    // document.getElementById('join-button').disabled = false;
    
                    // Store the selected tournament
                    document.getElementById('join-button').dataset.selectedIndex = index;
                });
            });
        }
    }
    if (joinTournament.style.display === 'block') {
        updateTournamentList();
    }

}