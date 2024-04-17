const quests = {
  menu() {
    Menu.setNewItem(
      [{ name: "quest-start", value: "quest" }],
      [
        {
          name: "quest-start",
          value: () => {
            store.data.quests.enable = !store.data.quests.enable;
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
      ]
    );
  },
  start() {
    if (store.data.quests.enable) {
      const mod = urlParams.get("mod");
      const questButton = document.getElementsByClassName("menuitem")[1];
      console.log(mod);
      if (mod != "quests") {
        questButton.click();
      }
      const questList = [1, 2, 3, 4, 5].map(
        (index) =>
          document.getElementsByClassName("contentboard_start")[0].children[
            index
          ]
      );
      questList.forEach((quest) => {
        Array.from(quest.children).forEach((element) => {
          const links = element.querySelectorAll("a");
          Array.from(links).forEach((link) => {
            if (!link.classList.contains("quest_slot_button_cancel")) {
              link.click();
            }
          });
        });
      });
    }
  },
};
