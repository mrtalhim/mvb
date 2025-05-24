import { ref } from 'vue';

export function useModals() {
    // Transaction Log Modal
    const isTransactionLogModalVisible = ref(false);
    const toggleTransactionLogModal = () => {
        isTransactionLogModalVisible.value = !isTransactionLogModalVisible.value;
    };

    // Restart Confirmation Modal
    const isRestartConfirmationModalVisible = ref(false);
    const openRestartConfirmationModal = () => {
        isRestartConfirmationModalVisible.value = true;
    };
    const closeRestartConfirmationModal = () => {
        isRestartConfirmationModalVisible.value = false;
    };

    return {
        isTransactionLogModalVisible,
        toggleTransactionLogModal,
        isRestartConfirmationModalVisible,
        openRestartConfirmationModal,
        closeRestartConfirmationModal,
    };
}
