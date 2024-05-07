import axios from 'axios';

const formatCurrencyRates = (data, outCurrency) => {
  const displayData = data.DISPLAY;

  const rates = Object.keys(displayData).map((currencyName) => {
    const names = {
      btc: 'Bitcoin',
      eth: 'Ethereum',
      usdt: 'Tether',
      bnb: 'BNB',
      usdc: 'USD Coin',
      xpr: 'XPR',
      ada: 'Cardano',
      matic: 'Polygon',
      doge: 'Dogecoin',
      sol: 'Solana',
      ton: 'Toncoin',
      dot: 'Polkadot',
      link: 'Chainlink',
      ltc: 'Litecoin',
      xlm: 'Stellar',
      atom: 'Cosmos',
      vet: 'VeChain',
      fil: 'Filecoin',
      cake: 'PancakeSwap',
      aave: 'Aave',
      etc: 'Ethereum Classic',
      xrp: 'Ripple',
      nano: 'Nano',
      bch: 'Bitcoin Cash'
    };

    const dayPercent = displayData[currencyName][outCurrency].CHANGEPCT24HOUR;
    const isPositive = !dayPercent.startsWith('-');

    return {
      name: names[currencyName.toLowerCase()],
      short_name: currencyName.toLowerCase(),
      price: displayData[currencyName][outCurrency].PRICE.replace(/\s/g, ''),
      day_percent: dayPercent,
      is_positive: isPositive
    };
  });

  return rates;
};

export const getCurrencyRates = async (outCurrency = 'USD') => {
  const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
  const cryptoSymbols = 'ADA,BNB,BTC,DOGE,ETH,MATIC,SOL,TON,USDC,USDT,XPR';

  try {
    const { data } = await axios.get(
      `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${cryptoSymbols}&tsyms=${outCurrency}&api_key=${apiKey}`
    );

    return formatCurrencyRates(data, outCurrency);
  } catch (error) {
    console.error('error', error);
    throw new Error('Error fetching crypto prices');
  }
};
