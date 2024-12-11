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
    if (store.data.gold.timeOut > 0) {
      const countdowngold = setInterval(() => {
        store.data.gold.timeOut -= 1; // Restar 1 al timeOut cada segundo
        document.getElementById(
          "goldTimer"
        ).innerText = `: ${store.data.gold.timeOut}s`;
        if (store.data.gold.timeOut <= 0) {
          clearInterval(countdowngold); // Detener el intervalo cuando timeOut sea 0
          window.location.reload(); // Recargar la página
        }
      }, 1000); // Intervalo de 1 segundo
    }

    const goldValElement = document.getElementById("sstat_gold_val");
    const goldValue = parseInt(
      goldValElement.textContent
        .replace(/\./g, "") // Elimina todos los puntos (separadores de miles)
        .replace(",", ".") // Reemplaza la coma (separador decimal) por
    );
    const mod = urlParams.get("mod");
    const goldIsHigherThanMinAndHold =
      goldValue >=
      parseInt(store.data.gold.goldMin) + parseInt(store.data.gold.goldHold);

    // Acciones comunes de venta
    const sellPackages = async () => {
      for (const element of store.data.gold.packagesPurchased) {
        statusLog.innerText = "Preparando venta";
        const bags = Array.from(
          document.getElementsByClassName("awesome-tabs")
        ).filter((item) => item.hasAttribute("data-bag-number"));
        statusLog.innerText = "Abriendo mochila...";
        if (bags.length > 0) bags[0].click();
        await info.sleep(1000);
        await info.sellPackage(element.name, element.price);
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
        }/game/index.php?mod=guildMarket&fl=0&fq=-1&f=0&qry=&seller=&s=p&p=1&sh=${urlParams.get(
          "sh"
        )}`;
      }
    };

    if (store.data.gold.enable && store.data.gold.timeOut <= 0) {
      if (store.data.gold.packagesPurchased.length > 0) {
        savingGold = true;
        statusLog.innerText = "Vendiendo rotativos pendientes";
        openMenu();
        await sellPackages();
        await info.sleep(2000);
      }

      if (goldIsHigherThanMinAndHold) {
        savingGold = true;

        openMenu();
        document.getElementById("inventory_nav").children[0].click();

        statusLog.innerText = "Verificando paquetes atascados en inventario";
        await info.veryfyIfHaveBrokenPackages();
        await info.sleep(2000);

        statusLog.innerText = "Comprando rotativo";

        statusLog.innerText = "Listando Rotativos";
        let totalPaginas =
          parseInt(
            document
              .getElementsByClassName("standalone")[0]
              .textContent.match(/Página\s+\d+\s+\/\s+(\d+)/)?.[1]
          ) || 1;

        let guildMarkedList = [];

        for (let i = totalPaginas; i >= 1; i--) {
          const data = await info.getGuildMarkedItems(i);
          guildMarkedList = guildMarkedList.concat(data);
        }

        if (guildMarkedList.length == 0) {
          console.log("escape 1");
          savingGold = false;
          statusLog.innerText = "Sin rotativos listados";
          store.data.gold.timeOut = 20;
          return;
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
        console.log("escape 2");
        savingGold = false;
        store.data.gold.timeOut = 20;
        statusLog.innerText = "Sin rotativos pendientes";
        statusLog.innerText = "Recargando en 3";
        await info.sleep(2000);
        statusLog.innerText = "Recargando en 2";
        await info.sleep(2000);
        statusLog.innerText = "Recargando en 1";
        await info.sleep(2000);
        statusLog.innerText = "Recargando...";
        window.location.reload();
      }
    }
  },
};
