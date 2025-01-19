const smelt = {
  menu() {
    Menu.setNewItem(
      [{ name: "smelt-start", value: "smelt" }],
      [
        {
          name: "smelt-start",
          value: () => {
            store.data.smelt.enable = !store.data.smelt.enable;
          },
        },
      ],
      [
        {
          name: "smelt",
          value: (button, target) => {
            button.checked = store.data.smelt.enable;
          },
        },
      ]
    );
  },
  async start() {
    if (store.data.smelt.enable) {
      const goldValElement = document.getElementById("sstat_gold_val");
      const goldValue = parseInt(
        goldValElement.textContent
          .replace(/\./g, "") // Elimina todos los puntos (separadores de miles)
          .replace(",", ".") // Reemplaza la coma (separador decimal) por
      );

      if (store.data.smelt.timeOut > 0) {
        const countdowngold = setInterval(() => {
          store.data.smelt.timeOut -= 1; // Restar 1 al timeOut cada segundo
          document.getElementById(
            "smeltTimer"
          ).innerText = `: ${store.data.smelt.timeOut}s`;
          if (store.data.smelt.timeOut <= 0) {
            clearInterval(countdowngold); // Detener el intervalo cuando timeOut sea 0
            window.location.reload(); // Recargar la página
          }
        }, 1000); // Intervalo de 1 segundo
      }

      statusLog.innerText = "Iniciando Fundición";
      smelting = true;
      statusLog.innerText = "Buscando forjas";
      let forges = await info.getForges();
      forges.finished.forEach(async (forge) => {
        await info.storeResourcesFromSmelt(forge["forge_slots.slot"]);
      });

      if (forges.closed.length === 0) {
        statusLog.innerText = "No hay forjas disponibles";
        smelting = false;
        return;
      }
      statusLog.innerText = "forja encontrada";
      let forgeToSmelt = forges.closed[0]["forge_slots.slot"];
      statusLog.innerText = "Buscando items para fundir";
      let itemToSmeltId = await info.getItemForSmelt();

      if (!itemToSmeltId) {
        statusLog.innerText = "No hay items para fundir";
        const formId = await info.getItemForSmeltInPackages();

        if (formId) {
          statusLog.innerText = "Buscando items para fundir en paquetes";
          await info.collectPackage(formId, { x: 7, y: 3 });
          statusLog.innerText = "Item encontrado";
          itemToSmeltId = await info.getItemForSmelt();
        }
        if (!smeltingBagItems) {
          statusLog.innerText = "No hay items para fundir";
          smelting = false;
          return;
        }
      }

      const price = await info.getSmeltItemPriceRent(
        forgeToSmelt,
        itemToSmeltId
      );
      if (price >= goldValue) {
        store.data.smelt.timeOut = 20;
        statusLog.innerText = "";
        return;
      }
      statusLog.innerText = "Fundiendo items";
      await info.smeltResourcesFromSmelt(forgeToSmelt, itemToSmeltId);
    }
  },
};
