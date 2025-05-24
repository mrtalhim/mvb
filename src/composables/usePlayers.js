import { ref, watch } from 'vue';

export function usePlayers(playerCount, startingMoney) {
    const players = ref([]);

    const initializePlayers = () => {
        console.log("Initializing players with count:", playerCount.value, "and money:", startingMoney.value);
        const playerArray = [];
        for (let i = 1; i <= playerCount.value; i++) {
            playerArray.push({ id: i, name: `Player ${i}`, balance: startingMoney.value });
        }
        players.value = playerArray;
    };

    // Initialize on setup
    initializePlayers();

    // Re-initialize if props change (optional, depending on desired behavior)
    watch([playerCount, startingMoney], initializePlayers);

    const getPlayer = (playerName) => {
        return players.value.find(p => p.name === playerName);
    };

    const updatePlayerBalance = (playerName, amountChange) => {
        const playerIndex = players.value.findIndex(p => p.name === playerName);
        if (playerIndex !== -1) {
            // Create a new array for reactivity
            const updatedPlayers = [...players.value];
            updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                balance: updatedPlayers[playerIndex].balance + amountChange
            };
            players.value = updatedPlayers;
            console.log(`Player (${playerName}) balance updated by ${amountChange}. New balance:`, updatedPlayers[playerIndex].balance);
            return true;
        }
        console.error(`Player ${playerName} not found for balance update.`);
        return false;
    };


    return {
        players,
        getPlayer,
        updatePlayerBalance,
        initializePlayers // Expose if needed externally, e.g., for restart
    };
}
