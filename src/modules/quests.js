const quests = {
  menu() {
    Menu.setNewItem(
      [
        { name: "quest-start", value: "quest" },
        { name: "quest-search-food", value: "quest.searchFood" },
      ],
      [
        {
          name: "quest-start",
          value: () => {
            store.data.quests.enable = !store.data.quests.enable;
          },
        },
        {
          name: "quest-search-food",
          value: () => {
            store.data.quests.searchFood = !store.data.quests.searchFood;
          },
        },
      ],
      [
        {
          name: "quest",
          value: (button, target) => {
            button.checked = store.data.quests.enable;
          },
        },
        {
          name: "quest.searchFood",
          value: (button, target) => {
            button.checked = store.data.quests.searchFood;
          },
        },
      ]
    );
  },
  start() {
    store.data.quests.searchFood = store.data.quests.searchFood ?? false;
    if (store.data.quests.enable) {
      const mod = urlParams.get("mod");
      const questButton = document.getElementsByClassName("menuitem")[1];
      if (mod != "quests") {
        questButton.click();
      } else {
        const questList = [1, 2, 3, 4, 5].map(
          (index) =>
            document.getElementsByClassName("contentboard_start")[0].children[
              index
            ]
        );
        let missionCount = 0;

        questList.forEach((quest) => {
          Array.from(quest.children).forEach((element) => {
            const links = element.querySelectorAll("a");
            Array.from(links).forEach((link) => {
              if (store.data.quests.searchFood) {
                statusLog.innerText = "Buscando misiones con comida";
                let hasReward =
                  link.previousElementSibling.children[6].children;
                if (hasReward.length > 0) {
                  if (
                    !link.classList.contains("quest_slot_button_cancel") &&
                    hasReward[0].outerHTML.includes("En uso: Cura")
                  ) {
                    missionCount++;
                    link.click();
                  }
                }
              } else {
                statusLog.innerText = "Buscando misiones";
                if (!link.classList.contains("quest_slot_button_cancel")) {
                  missionCount++;
                  link.click();
                }
              }
            });
          });
        });
        info.sleep(2000);
        if (missionCount < 1) {
          document.getElementById("quest_footer_reroll").children[0].click();
        }
      }
    }
  },
};
