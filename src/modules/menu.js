const Menu = {
  switchButtons: {},
  actions: {},
  typeInputList: {},
  /**
   *
   * @param {[{name:string,value:string}]} newSwitchButtons Acepta arreglo de objetos donde se indica la gtkey asociada a un elemento del objeto de configuracion ej: gtkey="expedition-start". Este input que manipula un switch se asocia al objeto store.data.expedition.enable por lo que el value debe ser expedition. {name: "expedition-start", value: "expedition"}
   * @param {[{name:string,value:Function}]} newActions Acepta arreglo de objetos donde se indica el nombre que esta relacionado a la accion y una funcion a ejecutar
   * @param {[{name:string,value:string}]} newTypeInputList Acepta un arreglo de objetos donde se indica el elemento a modificar dentro del objeto de configuracion
   */
  setNewItem: (
    newSwitchButtons = [],
    newActions = [],
    newTypeInputList = []
  ) => {
    newSwitchButtons.forEach((button) => {
      Menu.switchButtons[button.name] = button.value;
    });
    newActions.forEach((action) => {
      Menu.actions[action.name] = action.value;
    });
    newTypeInputList.forEach((typeInputItem) => {
      Menu.typeInputList[typeInputItem.name] = typeInputItem.value;
    });
  },
};

const menu = {
  start(functions) {
    loader.html("mainMenu", (html) => {
      jQuery("#container_game").append(html);
      this.createEventListeners();
      functions();
    });
  },

  createEventListeners() {
    const menuButtons = document.querySelectorAll("[gtkey]");

    menuButtons.forEach((button) => {
      const key = button.getAttribute("gtkey");
      const target = Menu.switchButtons[key];
      if (target && typeof Menu.typeInputList[target] === "function") {
        Menu.typeInputList[target](button, target);
      }

      button.addEventListener("click", () => {
        if (Menu.actions[key]) {
          Menu.actions[key](button);
        }
      });
    });
  },
};
