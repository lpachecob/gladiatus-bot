const eventExpedition = {
  menu() {
    Menu.setNewItem(
      [
        { name: "event-start", value: "event" },
        { name: "select-event-enemy", value: "event.enemy" },
      ],
      [
        {
          name: "event-start",
          value: (button) => {
            store.data.event.enable = !store.data.event.enable;
          },
        },
        {
          name: "select-event-enemy",
          value: (button) => {
            store.data.event.enemy = button.selectedIndex;
          },
        },
      ],
      [
        {
          name: "event",
          value: (button, target) => {
            button.checked = store.data[target].enable;
          },
        },
        {
          name: "event.enemy",
          value: (button, target) => {
            setTimeout(() => {
              button.selectedIndex = store.data[target.split(".")[0]].enemy;
            }, 1);
          },
        },
      ]
    );
  },

  start() {
    if (store.data.event.enable) {
      const locationId = urlParams.get("loc");
      const eventLocation = locationId === "desert";

      store.data.event.timeOut--;
      const countdown = setInterval(() => {
        store.data.event.timeOut--;

        if (store.data.event.timeOut <= 0) {
          clearInterval(countdown);
          window.location.reload();
        }
      }, 1000);

      if (eventLocation) {
        const tickerElement = document.querySelector(".section-header .ticker");
        if (tickerElement) {
          const timeText = tickerElement.textContent.match(/\d+:\d+:\d+/)[0];
          const [hours, minutes, seconds] = timeText.split(":").map(Number);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          store.data.event.timeOut = totalSeconds;
        } else {
          store.data.event.timeOut = 0;
        }
      }

      if (
        !eventLocation &&
        store.data.event.timeOut <= 0 &&
        player.health >= store.data.heal.hpMin
      ) {
        this.goToLocation();
      }
      if (
        eventLocation &&
        player.health >= store.data.heal.hpMin &&
        store.data.event.timeOut <= 0
      ) {
        const texto =
          document.getElementsByClassName("section-header")[0].children[1]
            .innerText;

        // Usa una expresión regular para obtener el número de puntos
        const puntos = texto.match(/(\d+)/)[0];

        // Convierte el resultado a número entero, si es necesario
        const puntosEvento = parseInt(puntos, 10);

        const expeditionButton =
          document.getElementsByClassName("expedition_button");
        if (puntosEvento > 0) expeditionButton[store.data.event.enemy].click();
      }
    }
  },
  goToLocation() {
    let eventLocation = document.getElementsByClassName(
      "menuitem glow eyecatcher"
    )[0];

    setTimeout(() => {
      eventLocation.click();
    }, 1);
  },
};
