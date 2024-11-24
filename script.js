async function updateBitcoinPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        const price = data.bitcoin.usd;
        document.getElementById('btc-price').textContent = `$${price.toLocaleString()}`;
    } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        document.getElementById('btc-price').textContent = 'Error loading price';
    }
}

updateBitcoinPrice();
setInterval(updateBitcoinPrice, 60000);