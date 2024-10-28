
export const walletFormatting = (wallet: string) => {
    if (wallet.length > 32) {
        return wallet.slice(0, 6) + "..." + wallet.slice(-4);
    } else {
        return wallet
    }
}
