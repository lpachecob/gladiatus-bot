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

    statusLog.innerText = "Fundiendo items";
    await info.smeltResourcesFromSmelt(forgeToSmelt, itemToSmeltId);
  },
};
