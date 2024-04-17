const turma = {
  menu() {
    Menu.setNewItem(
      [
        { name: "turma-start", value: "turma.enable" },
        { name: "turma-provinciarum", value: "turma.provinciarum" },
        { name: "turma-enemy", value: "turma.enemy" },
      ],
      [
        {
          name: "turma-start",
          value: (button) => {
            store.data.turma.enable = !store.data.turma.enable;
          },
        },
        {
          name: "turma-provinciarum",
          value: (button) => {
            store.data.turma.provinciarum = !store.data.turma.provinciarum;
          },
        },
        {
          name: "turma-enemy",
          value: (button) => {
            store.data.turma.enemy = button.selectedIndex;
          },
        },
      ],
      [
        {
          name: "turma.enable",
          value: (button, target) => {
            button.checked = store.data.turma.enable;
          },
        },
        {
          name: "turma.provinciarum",
          value: (button, target) => {
            button.checked = store.data.turma.provinciarum;
          },
        },
        {
          name: "turma.enemy",
          value: (button, target) => {
            button.selectedIndex = store.data.turma.enemy;
          },
        },
      ]
    );
  },
  start() {
    if (store.data.turma.enable) {
      const arenaTimer = document.getElementById("cooldown_bar_text_ct");
      Observer.observerItem(arenaTimer, (mutation) => {
        if (mutation.target.innerText === "Al Circo Turma") {
          window.location.reload();
        }
      });
      if (arenaTimer.innerText === "Al Circo Turma") {
        turma.atack(arenaTimer);
      }
    }
  },
  goToArena(timer) {
    if (
      timer.innerText === "Al Circo Turma"
    ) {
      const arenaButton =
        document.getElementsByClassName("cooldown_bar_link")[3];

      const mod = urlParams.get("mod");
      const submod = urlParams.get("submod");
      const type = urlParams.get("aType");

      if (
        mod !== "arena" &&
        (submod !== "serverArena" || submod !== "grouparena")
      ) {
        arenaButton.click();
      }
      console.log(mod === "arena");

      if (
        !store.data.turma.provinciarum &&
        mod === "arena" &&
        submod !== "grouparena"
      ) {
        document.getElementsByClassName("awesome-tabs")[2].click();
      }
      if (
        store.data.turma.provinciarum &&
        mod === "arena" &&
        submod !== "serverArena" &&
        type !== "3"
      ) {
        document.getElementsByClassName("awesome-tabs")[3].click();
      }
    }
  },
  atack(timer) {
    statusLog.innerText = "Yendo al circo...";
    turma.goToArena(timer);
    const mod = urlParams.get("mod");
    const submod = urlParams.get("submod");
    const type = urlParams.get("aType");
    if (mod == "arena") {
      statusLog.innerText = "Obteniendo rivales...";
      let rivals;
      if (
        store.data.turma.provinciarum &&
        submod == "serverArena" &&
        type == "3"
      ) {
        rivals = document.getElementById("own3").getElementsByTagName("tr");
      } else if (submod == "grouparena") {
        rivals =
          document.getElementsByTagName("aside")[1].children[1].children[0]
            .children[0].children;
      }
      if (this.validateIfAtack()) {
        if (
          store.data.turma.provinciarum &&
          submod == "serverArena" &&
          type == "3"
        ) {
          statusLog.innerText = "Atacando...";
          rivals[store.data.turma.enemy + 1].children[3].children[0].click();
        } else if (!store.data.turma.provinciarum && submod == "grouparena") {
          statusLog.innerText = "Atacando...";
          rivals[store.data.turma.enemy + 1].children[2].children[0].click();
        }
      }
    }
  },
  validateIfAtack() {
    return true;
  },
};
