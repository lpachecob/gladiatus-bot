const heal = {
  menu() {
    Menu.setNewItem(
      [
        { name: "heal", value: "heal" },
        { name: "heal-start", value: "heal.enable" },
        { name: "heal-min", value: "heal.hpMin" },
        { name: "heal-max-price-food", value: "heal.maxPriceFood" },
        { name: "heal-buy-food", value: "heal.buyFood" },
        { name: "heal-buy-market", value: "heal.buyInMarket" },
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
          name: "heal-buy-market",
          value: () => {
            store.data.heal.buyInMarket = !store.data.heal.buyInMarket;
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
          name: "heal.maxPriceFood",
          value: (button, target) => {
            button.value = store.data.heal.maxPriceFood;
            button.addEventListener("keyup", () => {
              store.data.heal.maxPriceFood = button.value;
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
          name: "heal.buyInMarket",
          value: (button, target) => {
            button.checked = store.data.heal.buyInMarket;
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
    store.data.heal.timeOut = store.data.heal.timeOut ?? 0;
    if (store.data.heal.timeOut > 0) {
      const countdownHeal = setInterval(() => {
        store.data.heal.timeOut -= 1; // Restar 1 al timeOut cada segundo
        document.getElementById(
          "healTimer"
        ).innerText = `: ${store.data.heal.timeOut}s`;
        if (store.data.heal.timeOut <= 0) {
          clearInterval(countdownHeal); // Detener el intervalo cuando timeOut sea 0
          window.location.reload(); // Recargar la página
        }
      }, 1000); // Intervalo de 1 segundo
      return;
    }

    if (!store.data.heal.enable) {
      healing = false;
      return;
    }
    healing = true;

    const mainMenuLink = document.getElementsByClassName("menuitem")[0];

    if (player.health <= store.data.heal.hpMin) {
      if (urlParams.get("mod") !== "overview") {
        mainMenuLink.click();
      } else {
        await this.openBagAndHeal();
      }
    }
  },

  async openBagAndHeal() {
    const bags = Array.from(
      document.getElementsByClassName("awesome-tabs")
    ).filter((item) => item.hasAttribute("data-bag-number"));

    statusLog.innerText = "Abriendo mochila...";
    bags[store.data.heal.bag].click();

    await this.tryToHeal();
  },

  async tryToHeal() {
    const foodItem = Array.from(
      document.getElementsByClassName("ui-draggable")
    ).filter((item) => item.hasAttribute("data-vitality"))[0];
    const dropTarget = document.getElementsByClassName("ui-droppable")[0];
    if (foodItem) {
      this.simulateDragAndDrop(foodItem, dropTarget);
    } else {
      await this.getFootFromPackages();
      await this.buyFood();
      await this.buyInMarket();
      healing = false;
      setTimeout(() => window.location.reload(), 5000);
    }
  },

  async getFootFromPackages() {
    statusLog.innerText = "Buscando comida en paquetes...";
    const formId = await info.searchFootPackage();
    if (formId) {
      await info.collectPackage(formId, { x: 2, y: 1 }).then(() => {
        window.location.reload();
      });
    }
  },

  async buyFood() {
    if (store.data.heal.buyFood) {
      const goldValElement = document.getElementById("sstat_gold_val");
      const goldValue = parseFloat(
        goldValElement.textContent.replace(/\./g, "").replace(",", ".")
      );
      statusLog.innerText = "Comprando comida...";
      const foodItem = await info.searchFoodInVendor();
      let workClothes = await info.getWorkClothesCount();

      if (store.data.heal.useCloths && workClothes > 0) {
        statusLog.innerText = "Actualizando vendedor...";
        info.refreshVendor();
      } else if (!foodItem) {
        // store.data.heal.enable = false;
        // store.data.heal.timeOut = 40;
        // setTimeout(() => window.location.reload(), 1000);
        return;
      }

      const priceGold = foodItem.getAttribute("data-price-gold");
      if (priceGold < goldValue) {
        await info.buyItem(foodItem);
        setTimeout(() => window.location.reload(), 5000);
      }
    }
  },

  async buyInMarket() {
    if (store.data.heal.buyInMarket) {
      statusLog.innerText = "Comprando en el mercado...";
      const marketPage = await info.getMarketPage(1, 7);
      let parser = new DOMParser();
      let doc = parser.parseFromString(marketPage, "text/html");
      let totalPaginas =
        parseInt(
          doc
            .getElementsByClassName("standalone")[0]
            .textContent.match(/Página\s+\d+\s+\/\s+(\d+)/)?.[1]
        ) || 1;

      let markedList = [];

      const maxIteraciones = Math.min(10, totalPaginas); // Determina el límite máximo de iteraciones
      for (let i = totalPaginas; i >= totalPaginas - maxIteraciones + 1; i--) {
        const data = await info.getGeneralMarkedItems(i, 7);
        markedList = markedList.concat(data);
      }      

      const itemToBuy = markedList
        .filter((item) => !item.itemName.includes("Vinculado al alma de"))
        .reduce((cheapestItem, currentItem) => {
          return !cheapestItem || currentItem.price < cheapestItem.price
            ? currentItem
            : cheapestItem;
        }, null);
console.log(itemToBuy)
      const goldValElement = document.getElementById("sstat_gold_val");

      const goldValue = parseFloat(
        goldValElement.textContent.replace(/\./g, "").replace(",", ".")
      );
      if ((itemToBuy, itemToBuy.price <= parseInt(goldValue))) {
        await info.buyMarkedItem(itemToBuy.buyId, 7);
        setTimeout(() => window.location.reload(), 5000);
      }
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
    info.sleep(1000).then(() => {
      statusLog.innerText = "Recargando página...";
      window.location.reload();
    });
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
