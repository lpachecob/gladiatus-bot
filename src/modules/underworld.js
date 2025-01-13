const underworld = {
  menu() {
    Menu.setNewItem(
      [{ name: "underworld-start", value: "underworld" }],
      [
        {
          name: "underworld-start",
          value: () => {
            store.data.underworld.enable = !store.data.underworld.enable;
          },
        },
      ],
      [
        {
          name: "underworld",
          value: (button, target) => {
            button.checked = store.data.underworld.enable;
          },
        },
      ]
    );
  },
  start() {
    if (!inUnderworld) {
      return;
    }

    if (store.data.underworld.enable) {
      if (player.health < store.data.heal.hpMin) {
        return;
      }

      const lastValidChild = Array.from(
        document.getElementById("submenu2").children
      )
        .reverse()
        .find(
          (child) =>
            !child.classList.contains("menuitem") ||
            !child.classList.contains("inactive")
        );

      const expeditionTimer = document.getElementById(
        "cooldown_bar_text_expedition"
      );

      Observer.observerItem(expeditionTimer, (mutation) => {
        if (mutation.target.innerText === "Ir a la Expedición") {
          window.location.reload();
        }
      });

      if (expeditionTimer.innerText !== "Ir a la Expedición") return;

      let readyToAttack =
        urlParams.get("mod") != "location " &&
        lastValidChild.classList.contains("active");

      if (!readyToAttack) {
        lastValidChild.click();
      }

      if (
        player.health >= store.data.heal.hpMin &&
        player.expeditionPoints > 0
      ) {
        statusLog.innerText = "Atacando en underworld";

        const expeditionBoxes =
          document.getElementsByClassName("expedition_box");

        const lastElementWithoutImage = Array.from(expeditionBoxes)
          .reverse()
          .find((box) => {
            const img = box.children[0].children[1].children[0];
            return (
              img &&
              img.src !==
                "https://gf2.geo.gfsrv.net/cdnae/904194973d21066c96cb414d04d676.jpg"
            );
          });

        lastElementWithoutImage.children[2].click();
        resolve("Attacked in underworld");
      }
    }
  },
};
