const heal = {
  menu() {
    Menu.setNewItem(
      [
        { name: "heal", value: "heal" },
        { name: "heal-start", value: "heal.enable" },
        { name: "heal-min", value: "heal.hpMin" },
        { name: "heal-buy-food", value: "heal.buyFood" },
        { name: "heal-use-cloths", value: "heal.useCloths" },
        { name: "inventory-slot", value: "heal.bag" },
      ],
      [
        {
          name: "heal-start",
          value: () => {
            store.data.heal.enable = !store.data.heal.enable;
          },
        },
        {
          name: "inventory-slot",
          value: (button) => {
            store.data.heal.bag = button.selectedIndex;
          },
        },
        {
          name: "heal-buy-food",
          value: () => {
            store.data.heal.buyFood = !store.data.heal.buyFood;
          },
        },
        {
          name: "heal-use-cloths",
          value: () => {
            store.data.heal.useCloths = !store.data.heal.useCloths;
          },
        },
      ],
      [
        {
          name: "heal.enable",
          value: (button, target) => {
            button.checked = store.data.heal.enable;
          },
        },
        {
          name: "heal.hpMin",
          value: (button, target) => {
            button.value = store.data.heal.hpMin;
            button.addEventListener("keyup", () => {
              store.data.heal.hpMin = button.value;
            });
          },
        },
        {
          name: "heal.buyFood",
          value: (button, target) => {
            button.checked = store.data.heal.buyFood;
          },
        },
        {
          name: "heal.useCloths",
          value: (button, target) => {
            button.checked = store.data.heal.useCloths;
          },
        },
        {
          name: "heal.bag",
          value: (button, target) => {
            button.selectedIndex = store.data.heal.bag;
          },
        },
      ]
    );
  },
  async start() {
    healing = true;
    if (!store.data.heal.enable) return;

    const mainMenuLink = document.getElementsByClassName("menuitem")[0];

    if (player.health <= store.data.heal.hpMin) {
      if (urlParams.get("mod") !== "overview") {
        mainMenuLink.click();
      } else {
        this.openBagAndHeal();
      }
    }
    healing = false;
  },

  openBagAndHeal() {
    const bags = Array.from(
      document.getElementsByClassName("awesome-tabs")
    ).filter((item) => item.hasAttribute("data-bag-number"));

    statusLog.innerText = "Abriendo mochila...";
    bags[store.data.heal.bag].click();

    setTimeout(() => this.tryToHeal(), 1000);
  },

  async tryToHeal() {
    const foodItem = Array.from(
      document.getElementsByClassName("ui-draggable")
    ).filter((item) => item.hasAttribute("data-vitality"))[0];
    const dropTarget = document.getElementsByClassName("ui-droppable")[0];

    console.log(foodItem);

    if (foodItem) {
      this.simulateDragAndDrop(foodItem, dropTarget);
    } else {
      statusLog.innerText = "Sin comida...";
      await this.buyFood();
    }
  },

  async buyFood() {
    if (store.data.heal.buyFood) {
      const goldValElement = document.getElementById("sstat_gold_val");
      const goldValue = parseFloat(
        goldValElement.textContent.replace(".", "").replace(",", ".")
      );
      statusLog.innerText = "Comprando comida...";
      const foodItem = await info.searchFoodInVendor();
      let workClothes = await info.getWorkClothesCount();

      if (!foodItem && store.data.heal.useCloths && workClothes > 0) {
        statusLog.innerText = "Actualizando vendedor...";
        info.refreshVendor();
      } else {
        // store.data.heal.enable = false;
        setTimeout(() => window.location.reload(), 1000);
      }

      const priceGold = foodItem.getAttribute("data-price-gold");
      if (priceGold < goldValue) await info.buyItem(foodItem);
      setTimeout(() => window.location.reload(), 5000);
    }
  },

  simulateDragAndDrop(dragElement, dropTarget) {
    statusLog.innerText = "Cargando coordenadas...";
    const { centroX, centroY } = this.calculateDropPosition(
      dragElement,
      dropTarget
    );

    this.dispatchMouseEvent(
      dragElement,
      "mousedown",
      dragElement.getBoundingClientRect().left,
      dragElement.getBoundingClientRect().top
    );
    statusLog.innerText = "Seleccionado comida...";

    this.dispatchMouseEvent(dragElement, "mousemove", centroX, centroY);
    statusLog.innerText = "Moviendo comida...";

    this.dispatchMouseEvent(dropTarget, "mouseup", centroX, centroY);
    statusLog.innerText = "Soltando comida...";

    statusLog.innerText = "Recargando página...";
    window.location.reload();
  },

  calculateDropPosition(dragElement, dropTarget) {
    const targetRect = dropTarget.getBoundingClientRect();
    const elementRect = dragElement.getBoundingClientRect();

    const centroX =
      targetRect.left +
      (targetRect.width - elementRect.width) / 2 +
      window.pageXOffset;
    const centroY =
      targetRect.top +
      (targetRect.height - elementRect.height) / 2 +
      window.pageYOffset;

    return { centroX, centroY };
  },

  dispatchMouseEvent(element, eventType, clientX, clientY) {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    });
    element.dispatchEvent(event);
  },
};
