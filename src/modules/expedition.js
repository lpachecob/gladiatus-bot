let expeditionLocations = [];

const expedition = {
  menu() {
    Menu.setNewItem(
      [
        { name: "expedition-start", value: "expedition" },
        { name: "select-expedition-location", value: "expedition.loc" },
        { name: "select-expedition-enemy", value: "expedition.enemy" },
      ],
      [
        {
          name: "expedition-start",
          value: (button) => {
            store.data.expedition.enable = !store.data.expedition.enable;
          },
        },
        {
          name: "select-expedition-location",
          value: (button) => {
            store.data.expedition.loc = button.selectedIndex;
          },
        },
        {
          name: "select-expedition-enemy",
          value: (button) => {
            store.data.expedition.enemy = button.selectedIndex;
          },
        },
      ],
      [
        {
          name: "expedition",
          value: (button, target) => {
            button.checked = store.data[target].enable;
          },
        },
        {
          name: "expedition.loc",
          value: (button, target) => {
            setTimeout(() => {
              button.selectedIndex = store.data[target.split(".")[0]].loc;
            }, 1);
          },
        },
        {
          name: "expedition.enemy",
          value: (button, target) => {
            setTimeout(() => {
              button.selectedIndex = store.data[target.split(".")[0]].enemy;
            }, 1);
          },
        },
      ]
    );
  },
  init() {
    this.getLocations();
    this.setLocation();
  },
  getLocations() {
    const submenuElements = Array.from(
      document.getElementById("submenu2").children
    ).filter((element) => {
      return (
        element.tagName === "A" &&
        (element.className.trim() === "menuitem" ||
          element.className.trim() === "menuitem active")
      );
    });
    submenuElements.shift();

    expeditionLocations = submenuElements;
  },
  setLocation() {
    const htmlExpeditionLocations = document.getElementById(
      "gt-expedition-locations"
    );
    expeditionLocations.forEach((location, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = location.innerText.trim();
      htmlExpeditionLocations.appendChild(option);
    });
  },
  start() {
    if (store.data.expedition.enable) {
      const locationId = parseInt(urlParams.get("loc"));
      const expeditionButton =
        document.getElementsByClassName("expedition_button");
      const costReduceButtons = document.getElementsByClassName(
        "expedition_cooldown_reduce"
      );
      const expeditionTimer = document.getElementById(
        "cooldown_bar_text_expedition"
      );
      Observer.observerItem(expeditionTimer, (mutation) => {
        if (mutation.target.innerText === "Ir a la Expedición") {
          window.location.reload();
        }
      });
      if (
        locationId !== store.data.expedition.loc &&
        expeditionTimer.innerText === "Ir a la Expedición" &&
        player.health >= store.data.heal.hpMin &&
        player.expeditionPoints > 0
      ) {
        this.goToLocation();
      }
      if (
        locationId === store.data.expedition.loc &&
        costReduceButtons.length === 0 &&
        player.health >= store.data.heal.hpMin &&
        player.expeditionPoints > 0
      ) {
        expeditionButton[store.data.expedition.enemy].click();
      }
    }
  },
  goToLocation() {
    setTimeout(() => {
      expeditionLocations[store.data.expedition.loc].click();
    }, 1);
  },
};
