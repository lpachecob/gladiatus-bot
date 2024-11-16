const saveGold = {
  menu() {
    Menu.setNewItem(
      [
        { name: "gold-start", value: "gold" },
        { name: "gold-method", value: "gold.method" },
        { name: "gold-hold", value: "gold.goldHold" },
        { name: "gold-min", value: "gold.goldMin" },
        { name: "gold-max", value: "gold.goldMax" },
      ],
      [
        {
          name: "gold-start",
          value: (button) => {
            store.data.gold.enable = !store.data.gold.enable;
          },
        },
        {
          name: "gold-method",
          value: (button) => {
            store.data.gold.method = button.selectedIndex;
          },
        },
      ],
      [
        {
          name: "gold",
          value: (button, target) => {
            button.checked = store.data[target].enable;
          },
        },
        {
          name: "gold.method",
          value: (button, target) => {
            button.selectedIndex = store.data.gold.method;
          },
        },
        {
          name: "gold.goldHold",
          value: (button, target) => {
            button.value = store.data.gold.goldHold;
            button.addEventListener("keyup", () => {
              store.data.gold.goldHold = button.value;
            });
          },
        },
        {
          name: "gold.goldMin",
          value: (button, target) => {
            button.value = store.data.gold.goldMin;
            button.addEventListener("keyup", () => {
              store.data.gold.goldMin = button.value;
            });
          },
        },
        {
          name: "gold.goldMax",
          value: (button, target) => {
            button.value = store.data.gold.goldMax;
            button.addEventListener("keyup", () => {
              store.data.gold.goldMax = button.value;
            });
          },
        },
      ]
    );
  },
  async start() {
    console.log(store.data.gold.packagesPurchased);

    if (store.data.gold.timeOut > 0) {
      const countdowngold = setInterval(() => {
        store.data.gold.timeOut -= 1; // Restar 1 al timeOut cada segundo
        console.log(`Tiempo restante: ${store.data.gold.timeOut} segundos`);
        document.getElementById(
          "goldTimer"
        ).innerText = `: ${store.data.gold.timeOut}s`;
        if (store.data.gold.timeOut <= 0) {
          clearInterval(countdowngold); // Detener el intervalo cuando timeOut sea 0
          console.log("Timer completed");
          window.location.reload(); // Recargar la página
        }
      }, 1000); // Intervalo de 1 segundo
    }

    const goldValElement = document.getElementById("sstat_gold_val");
    const goldValue = parseFloat(
      goldValElement.textContent
        .replace(/\./g, "") // Elimina todos los puntos (separadores de miles)
        .replace(",", ".") // Reemplaza la coma (separador decimal) por un punto
    );
    console.log(goldValue);
    const mod = urlParams.get("mod");

    const goldIsHigherThanMinAndHold =
      goldValue >
      parseInt(store.data.gold.goldMin) + parseInt(store.data.gold.goldHold);

    // Acciones comunes de venta
    const sellPackages = async () => {
      console.log(store.data.gold.packagesPurchased);
      for (const element of store.data.gold.packagesPurchased) {
        statusLog.innerText = "Vendiendo Rotativo";
        console.log(element.name, element.price);
        await info.sellPackage(element.name, element.price);
        await info.sleep(2000);
      }
      store.data.gold.packagesPurchased = [];
      statusLog.innerText = "Rotativo vendido";
    };

    const collectPackages = async () => {
      for (const element of store.data.gold.packagesPurchased) {
        statusLog.innerText = "Buscando Rotativo";
        const formId = await info.searchPackage(element.name);
        statusLog.innerText = "Recogiendo Rotativo";
        await info.collectPackage(formId);
        await info.sleep(2000);
        window.location.reload();
      }

      statusLog.innerText = "Rotativo comprado";
    };

    // Acciones para abrir el menú correcto
    const openMenu = () => {
      if (mod !== "guildMarket") {
        window.location.href = `${
          window.location.origin
        }/game/index.php?mod=guildMarket&sh=${urlParams.get("sh")}`;
      }
    };
    console.log(store.data.gold.timeOut);
    if (store.data.gold.enable && store.data.gold.timeOut <= 0) {
      if (store.data.gold.packagesPurchased.length > 0) {
        savingGold = true;
        statusLog.innerText = "Vendiendo rotativos pendientes";
        openMenu();
        await sellPackages();
      }

      if (goldIsHigherThanMinAndHold) {
        savingGold = true;
        statusLog.innerText = "Comprando rotativo";

        openMenu();
        document.getElementById("inventory_nav").children[0].click();

        statusLog.innerText = "Listando Rotativos";
        const guildMarkedList = await info.getGuildMarkedItems();
        console.log(guildMarkedList);
        if (guildMarkedList.length == 0) {
          statusLog.innerText = "Sin rotativos listados";
          savingGold = false;
          store.data.gold.timeOut = 40;
          window.location.reload();
        }
        statusLog.innerText = "Rotativos listados";
        await info.sleep(2000);

        statusLog.innerText = "Comprando Rotativo";
        await info.buyGuildMarkedItem(guildMarkedList[0].buyId);
        store.data.gold.packagesPurchased.push({
          price: guildMarkedList[0].price,
          name: guildMarkedList[0].itemName,
        });

        await info.sleep(2000);
      }
      await collectPackages();

      if (store.data.gold.packagesPurchased.length == 0) {
        statusLog.innerText = "Sin rotativos pendientes";
        savingGold = false;
      }
    }
  },
};
