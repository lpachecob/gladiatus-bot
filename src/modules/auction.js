const auction = {
  menu() {
    Menu.setNewItem(
      [
        { name: "auction-start", value: "auction" },
        { name: "auction-search-food", value: "auction.bidFood" },
        { name: "auction-overbid", value: "auction.overbid" },
      ],
      [
        {
          name: "auction-start",
          value: () => {
            store.data.auction.enable = !store.data.auction.enable;
          },
        },
        {
          name: "auction-search-food",
          value: () => {
            store.data.auction.bidFood = !store.data.auction.bidFood;
          },
        },
        {
          name: "auction-overbid",
          value: () => {
            store.data.auction.overbid = !store.data.auction.overbid;
          },
        },
      ],
      [
        {
          name: "auction",
          value: (button, target) => {
            button.checked = store.data.auction.enable;
          },
        },
        {
          name: "auction.bidFood",
          value: (button, target) => {
            button.checked = store.data.auction.bidFood;
          },
        },
        {
          name: "auction.overbid",
          value: (button, target) => {
            button.checked = store.data.auction.overbid;
          },
        },
      ]
    );
  },
  async start() {
    store.data.auction.bidFood = store.data.auction.bidFood ?? false;
    store.data.auction.overbid = store.data.auction.overbid ?? false;
    const rubiesNumber = document.getElementById("sstat_ruby_val").innerText;
    const goldValElement = document.getElementById("sstat_gold_val");
    const goldValue = parseInt(
      goldValElement.textContent
        .replace(/\./g, "") // Elimina todos los puntos (separadores de miles)
        .replace(",", ".") // Reemplaza la coma (separador decimal) por
    );

    let goldProcess = goldValue;

    if (!store.data.auction.enable) {
      return;
    }
    if (!store.data.auction.bidFood) {
      return;
    }
    const { auctionStatus, auctionMinLevel } = await info.getAuctionData();
    if (
      auctionStatus.toLowerCase() === "corto" ||
      auctionStatus.toLowerCase() === "muy corto"
    ) {
      const auctionItems = await info.getAuctionItems(auctionMinLevel);
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      auctionItems.forEach(async (item, index) => {
        await delay(index * 100); // Retrasa cada iteración 10 ms acumulativos.

        if (goldProcess < item.bidAmount) {
          return; // Salta al siguiente elemento.
        }
        goldProcess -= item.bidAmount;
        await info.bidItem(
          item.auctionid,
          item.itemLevel,
          item.itemQuality,
          item.bidAmount,
          rubiesNumber
        );
      });
    }
  },
};
