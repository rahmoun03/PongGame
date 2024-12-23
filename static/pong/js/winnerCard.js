export function createWinnerCard(winnerName) {
    const style = document.createElement('style');
    style.textContent = `
        .winner-card {
            font-family: 'Roboto', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-around;
            background: linear-gradient(135deg, #252525, #1e1e1e);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            text-align: center;
            gap: 15px;
            width: 80%;
            max-width: 400px;
            height: 80%;
            max-height: 800px;
            margin: auto;
        }

        .winner-card .trophy {
            width: 90%;
            max-width: 350px;
            height: 70%;
            max-height: 350px;
            background: url('static/pong/assets/winner.png') no-repeat center;
            background-size: contain;
        }

        .winner-card h2 {
            font-family: 'Roboto', sans-serif;
            font-size: 1.8rem;
            margin-bottom: 10px;
            color: #00bcd4;
            text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
        }

        .winner-card p {
            font-size: 1.2rem;
            margin: 0;
            color: #ff5722;
        }
    `;

    const winnerCard = document.createElement('div');
    winnerCard.classList.add('winner-card');
    winnerCard.innerHTML = `
        <div class="trophy"></div>
        <div>
        <h2>Winner</h2>
        <p>${winnerName}</p></div>
    `;

    winnerCard.appendChild(style);

    return winnerCard;
}
