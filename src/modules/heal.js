const heal = {
  menu() {
    Menu.setNewItem(
      [
        { name: "heal", value: "heal" },
        { name: "heal-start", value: "heal.enable" },
        { name: "heal-min", value: "heal.hpMin" },
        { name: "heal-buy-food", value: "heal.buyFood" },
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
          name: "heal.bag",
          value: (button, target) => {
            button.selectedIndex = store.data.heal.bag;
          },
        },
      ]
    );
  },
  start() {
    healing = true;
    if (store.data.heal.enable) {
      const mainMenuLink = document.getElementsByClassName("menuitem")[0];

      if (
        player.health <= store.data.heal.hpMin &&
        urlParams.get("mod") !== "overview"
      ) {
        mainMenuLink.click();
      }

      if (
        urlParams.get("mod") === "overview" &&
        player.health <= store.data.heal.hpMin
      ) {
        const bags = Array.from(
          document.getElementsByClassName("awesome-tabs")
        ).filter((item) => item.hasAttribute("data-bag-number"));
        statusLog.innerText = "Abriendo mochila...";
        bags[store.data.heal.bag].click();
        // Selecciona el elemento que quieres arrastrar y el objetivo donde quieres soltarlo

        setTimeout(() => {
          const elementoArrastrar = Array.from(
            document.getElementsByClassName("ui-draggable")
          ).filter((item) => item.hasAttribute("data-vitality"))[0];
          const objetivoSoltar =
            document.getElementsByClassName("ui-droppable")[0];

          if (elementoArrastrar) {
            // Función para emular el proceso de arrastre y soltado
            function emularArrastreYSoltado() {
              statusLog.innerText = "Cargando coordenadas...";
              // Obtener las coordenadas y dimensiones del objetivo
              const objetivoRect = objetivoSoltar.getBoundingClientRect();
              const objetivoX = objetivoRect.left + window.pageXOffset;
              const objetivoY = objetivoRect.top + window.pageYOffset;
              const objetivoWidth = objetivoRect.width;
              const objetivoHeight = objetivoRect.height;

              // Obtener las dimensiones del elemento a arrastrar
              const elementoRect = elementoArrastrar.getBoundingClientRect();
              const elementoWidth = elementoRect.width;
              const elementoHeight = elementoRect.height;

              // Calcular las coordenadas donde el elemento debe colocarse en el centro del objetivo
              const centroX = objetivoX + (objetivoWidth - elementoWidth) / 2;
              const centroY = objetivoY + (objetivoHeight - elementoHeight) / 2;

              // Crear un evento de 'mousedown' en el elemento a arrastrar
              const eventoMouseDown = new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
                clientX: elementoRect.left,
                clientY: elementoRect.top,
              });
              statusLog.innerText = "Seleccionado comida...";
              elementoArrastrar.dispatchEvent(eventoMouseDown);

              // Crear un evento de 'mousemove' para mover el elemento hacia el centro del objetivo
              const eventoMouseMove = new MouseEvent("mousemove", {
                bubbles: true,
                cancelable: true,
                clientX: centroX,
                clientY: centroY,
              });
              statusLog.innerText = "Moviendo comida...";
              elementoArrastrar.dispatchEvent(eventoMouseMove);

              // Crear un evento de 'mouseup' en el objetivo para soltar el elemento
              const eventoMouseUp = new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: true,
                clientX: centroX,
                clientY: centroY,
              });
              statusLog.innerText = "Soltando comida...";
              objetivoSoltar.dispatchEvent(eventoMouseUp);

              statusLog.innerText = "Recargando página...";
              window.location.reload();
            }
            // Llama a la función para emular el proceso de arrastre y soltado
            emularArrastreYSoltado();
          } else {
            statusLog.innerText = "Sin comida...";
            store.data.heal.enable = false;
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }, 1000);
      }
    }
    healing = false;
  },
};
