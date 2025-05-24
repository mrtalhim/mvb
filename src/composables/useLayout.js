import { ref, computed, watch } from 'vue';

export function useLayout(playerCount, tabletopMode) {
    const layoutConfig = ref({});

    const generateLayoutConfig = (count) => {
        const config = {};
        // --- Add the exact same layout generation logic from the original component ---
        if (count === 2) {
            config["2"] = [
                { playerNum: 1, cellClass: 'player-1-cell player-count-2', orientation: 'down' },
                { playerNum: 2, cellClass: 'player-2-cell player-count-2', orientation: 'up' },
            ];
        } else if (count === 3) {
             config["3"] = [
                { playerNum: 1, cellClass: 'player-1-cell player-count-3', orientation: 'down' },
                { playerNum: 2, cellClass: 'player-2-cell player-count-3', orientation: 'up' },
                { playerNum: 3, cellClass: 'player-3-cell player-count-3', orientation: 'right' },
            ];
        } else if (count === 4) {
             config["4"] = [
                { playerNum: 1, cellClass: 'player-1-cell player-count-4', orientation: 'down' },
                { playerNum: 2, cellClass: 'player-2-cell player-count-4', orientation: 'right' },
                { playerNum: 3, cellClass: 'player-3-cell player-count-4', orientation: 'up' },
                { playerNum: 4, cellClass: 'player-4-cell player-count-4', orientation: 'left' },
            ];
        } else if (count === 5) {
             config["5"] = [
                { playerNum: 1, cellClass: 'player-1-cell player-count-5', orientation: 'down' },
                { playerNum: 2, cellClass: 'player-2-cell player-count-5', orientation: 'right' },
                { playerNum: 3, cellClass: 'player-3-cell player-count-5', orientation: 'up' },
                { playerNum: 4, cellClass: 'player-4-cell player-count-5', orientation: 'up' },
                { playerNum: 5, cellClass: 'player-5-cell player-count-5', orientation: 'left' },
            ];
        } else if (count === 6) {
             config["6"] = [
                { playerNum: 1, cellClass: 'player-1-cell player-count-6', orientation: 'down' },
                { playerNum: 2, cellClass: 'player-2-cell player-count-6', orientation: 'down' },
                { playerNum: 3, cellClass: 'player-3-cell player-count-6', orientation: 'right' },
                { playerNum: 4, cellClass: 'player-4-cell player-count-6', orientation: 'up' },
                { playerNum: 5, cellClass: 'player-5-cell player-count-6', orientation: 'up' },
                { playerNum: 6, cellClass: 'player-6-cell player-count-6', orientation: 'left' },
            ];
        } else if (count === 7) {
             config["7"] = [
                { playerNum: 1, cellClass: 'player-1-cell player-count-7', orientation: 'down' },
                { playerNum: 2, cellClass: 'player-2-cell player-count-7', orientation: 'right' },
                { playerNum: 3, cellClass: 'player-3-cell player-count-7', orientation: 'right' },
                { playerNum: 4, cellClass: 'player-4-cell player-count-7', orientation: 'up' },
                { playerNum: 5, cellClass: 'player-5-cell player-count-7', orientation: 'up' },
                { playerNum: 6, cellClass: 'player-6-cell player-count-7', orientation: 'left' },
                { playerNum: 7, cellClass: 'player-7-cell player-count-7', orientation: 'left' },
            ];
        } else if (count === 8) {
             config["8"] = [
                { playerNum: 1, cellClass: 'player-1-cell player-count-8', orientation: 'down' },
                { playerNum: 2, cellClass: 'player-2-cell player-count-8', orientation: 'down' },
                { playerNum: 3, cellClass: 'player-3-cell player-count-8', orientation: 'right' },
                { playerNum: 4, cellClass: 'player-4-cell player-count-8', orientation: 'right' },
                { playerNum: 5, cellClass: 'player-5-cell player-count-8', orientation: 'up' },
                { playerNum: 6, cellClass: 'player-6-cell player-count-8', orientation: 'up' },
                { playerNum: 7, cellClass: 'player-7-cell player-count-8', orientation: 'left' },
                { playerNum: 8, cellClass: 'player-8-cell player-count-8', orientation: 'left' },
            ];
        }
        // --- End of layout generation logic ---
        console.log("Generated Layout Config for", count, "players:", config);
        return config;
    };

    // Update layout config when playerCount changes
    watch(playerCount, (newCount) => {
        layoutConfig.value = generateLayoutConfig(newCount);
    }, { immediate: true }); // Run immediately on setup

    const getWalletOrientation = (walletName) => {
        if (!tabletopMode.value) {
            return 'up';
        }
        if (walletName === 'Bank' || walletName === 'Tax') {
            return 'up';
        }

        const playerNumber = parseInt(walletName.replace('Player ', ''));
        const currentLayout = layoutConfig.value[playerCount.value];
        if (!currentLayout) return 'up'; // Fallback if layout isn't ready

        const playerLayout = currentLayout.find(
            layout => layout.playerNum === playerNumber
        );
        return playerLayout ? playerLayout.orientation : 'up';
    };

    // Utility function (can be moved to a utils file if preferred)
    const getWalletColor = (walletName) => {
        if (walletName === 'Bank') return 'bg-mvb-gray';
        if (walletName === 'Tax') return 'bg-mvb-white';

        const playerIndex = parseInt(walletName.replace('Player ', '')) - 1;
        const playerColors = ['bg-mvb-blue', 'bg-mvb-green', 'bg-mvb-pale', 'bg-mvb-salmon', 'bg-mvb-orange', 'bg-mvb-yellow'];
        // Ensure playerIndex is valid before accessing colors
        if (isNaN(playerIndex) || playerIndex < 0) return 'bg-mvb-white';
        return playerColors[playerIndex % playerColors.length] || 'bg-mvb-white';
    };


    return {
        layoutConfig,
        getWalletOrientation,
        getWalletColor
    };
}
