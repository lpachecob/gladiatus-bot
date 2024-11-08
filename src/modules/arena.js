const arena = {
  menu() {
    Menu.setNewItem(
      [
        { name: "arena-start", value: "arena.enable" },
        { name: "arena-provinciarum", value: "arena.provinciarum" },
        { name: "arena-enemy", value: "arena.enemy" },
      ],
      [
        {
          name: "arena-start",
          value: (button) => {
            store.data.arena.enable = !store.data.arena.enable;
          },
        },
        {
          name: "arena-provinciarum",
          value: (button) => {
            store.data.arena.provinciarum = !store.data.arena.provinciarum;
          },
        },
        {
          name: "arena-enemy",
          value: (button) => {
            store.data.arena.enemy = button.selectedIndex;
          },
        },
      ],
      [
        {
          name: "arena.enable",
          value: (button, target) => {
            button.checked = store.data.arena.enable;
          },
        },
        {
          name: "arena.provinciarum",
          value: (button, target) => {
            button.checked = store.data.arena.provinciarum;
          },
        },
        {
          name: "arena.enemy",
          value: (button, target) => {
            button.selectedIndex = store.data.arena.enemy;
          },
        },
      ]
    );
  },
  start() {
    if (store.data.arena.enable) {
      const arenaTimer = document.getElementById("cooldown_bar_text_arena");
      Observer.observerItem(arenaTimer, (mutation) => {
        if (mutation.target.innerText === "Ir a la Arena") {
          window.location.reload();
        }
      });
      if (arenaTimer.innerText === "Ir a la Arena") {
        arena.atack(arenaTimer);
      }
    }
  },
  goToArena(timer) {
    if (
      player.health >= store.data.heal.hpMin &&
      timer.innerText === "Ir a la Arena"
    ) {
      const arenaButton =
        document.getElementsByClassName("cooldown_bar_link")[2];

      const mod = urlParams.get("mod");
      const submod = urlParams.get("submod");
      const type = urlParams.get("aType");

      if (mod !== "arena") {
        arenaButton.click();
      }
      if (
        !store.data.arena.provinciarum &&
        mod === "arena" &&
        submod !== null
      ) {
        document.getElementsByClassName("awesome-tabs")[0].click();
      }
      if (store.data.arena.provinciarum && mod === "arena" && type !== "2") {
        document.getElementsByClassName("awesome-tabs")[1].click();
      }
    }
  },
  atack(timer) {
    statusLog.innerText = "Yendo a la arena...";
    arena.goToArena(timer);
    const mod = urlParams.get("mod");
    const submod = urlParams.get("submod");
    const type = urlParams.get("aType");
    if (mod == "arena") {
      let rivals;
      statusLog.innerText = "Obteniendo rivales...";
      if (
        store.data.arena.provinciarum &&
        submod == "serverArena" &&
        type == "2"
      ) {
        rivals = document.getElementById("own2").getElementsByTagName("tr");
      } else if (submod == null) {
        rivals =
          document.getElementsByTagName("aside")[1].children[1].children[0]
            .children[0].children;
      }
      if (this.validateIfAtack()) {
        if (
          store.data.arena.provinciarum &&
          submod == "serverArena" &&
          type == "2"
        ) {
          statusLog.innerText = "Atacando...";
          rivals[store.data.arena.enemy + 1].children[3].children[0].click();
        } else if (!store.data.arena.provinciarum && submod == null) {
          statusLog.innerText = "Atacando...";
          rivals[store.data.arena.enemy + 1].children[2].children[0].click();
        }
      }
    }
    statusLog.innerText = "";
  },
  validateIfAtack() {
    return player.health >= store.data.heal.hpMin;
  },
};
