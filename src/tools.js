const Browser = typeof browser === "undefined" ? chrome : browser;
const manifest = Browser.runtime.getManifest();
const store = {
  init: function () {
    this.data = JSON.parse(localStorage.getItem("gtools")) || {};

    const saveDataHandler = {
      set: function (obj, prop, value) {
        obj[prop] = value;
        localStorage.setItem("gtools", JSON.stringify(store.data));
        return true;
      },
    };
    const applyProxyRecursively = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          obj[key] = new Proxy(obj[key], saveDataHandler);
          applyProxyRecursively(obj[key]);
        }
      }
    };
    this.data = new Proxy(this.data, saveDataHandler);
    applyProxyRecursively(this.data);
  },
};

const Observer = {
  config: {
    childList: true, // Observa cambios en los hijos del elemento
    attributes: true, // Observa cambios en los atributos del elemento
    characterData: true, // Observa cambios en los datos de carácter del elemento
  },
  observerItem: (elementToObserve, action) => {
    let observer = new MutationObserver((mutations) => {
      // Esta función se ejecuta cuando hay cambios en el elemento observado
      mutations.forEach((mutation) => {
        action(mutation);
      });
    });
    observer.observe(elementToObserve, Observer.config);
  },
};

const Timer = {
  setCountdownMessage(duracionSegundos, message, htmlElement, action) {
    let tiempoRestante = duracionSegundos;

    // Define una función que se ejecutará cada segundo.
    const intervalo = setInterval(() => {
      // Imprime el tiempo restante en la consola.
      htmlElement.innerText = `${message}${tiempoRestante}`;
      // Resta 1 segundo al tiempo restante.
      tiempoRestante--;

      // Si el tiempo restante llega a 0, detén el intervalo.
      if (tiempoRestante < 0) {
        clearInterval(intervalo);
        htmlElement.innerText = "";
        action();
      }
    }, 1000); // La función se ejecutará cada 1000 ms (1 segundo).
  },
};

let storeDefault = {
  player: {
    name: "",
    key: "",
    keyExp: 0,
    language: "es",
  },
  bot: {
    enable: false,
    hide: false,
    delay: 15,
    refresh: false,
    refreshTime: 30,
    relogin: false,
    combatLog: false,
    equipCostume: false,
    arenaCostume: 1,
    turmaCostume: 5,
  },
  quests: {
    enable: false,
    timeOut: 0,
  },
  heal: {
    enable: false,
    bag: 1,
    hpMin: 25,
    buyFood: false,
    useCloths: false,
    timeOut: 0,
  },
  underworld: {
    enable: false,
    useRuby: false,
    inUnderworld: false,
    rubyMax: 0,
    useMedic: false,
    useHealthPotion: false,
    enter: false,
    difficulty: 0,
    leave: false,
    equipCostume: false,
    wins: 0,
  },
  event: {
    enable: false,
    enemy: 0,
    timeOut: 0,
    useRuby: false,
  },
  expedition: {
    enable: false,
    loc: 0,
    enemy: 0,
    bonusFarm: false,
  },
  dungeon: {
    enable: false,
    loc: 0,
    advanced: false,
    skipBoss: false,
    restart: false,
    loose: false,
  },
  turma: {
    enable: false,
    provinciarum: false,
    enemy: 1,
    ignoreList: [],
    ignore: false,
  },
  arena: {
    enable: false,
    provinciarum: false,
    enemy: 1,
    ignoreList: [],
    ignore: false,
  },
  gold: {
    enable: false,
    timeOut: 0,
    method: 0,
    goldMax: 0,
    goldMin: 0,
    goldHold: 0,
    packagesPurchased: [],
    packagesLog: [],
    soulFilter: false,
    soulList: [],
  },
  smelt: {
    enable: false,
    bag: 513,
    timer: [],
    timeOut: 0,
    log: [],
    pickPackage: false,
    prefixList: ["Antonius"],
    suffixList: ["of assassination"],
    ignoreList: ["Antonius of assassination"],
    maxValue: 0,
    quality: false,
    qualityPurple: false,
    qualityOrange: false,
    qualityRed: false,
    qualityPrefixList: ["Antonius"],
    qualitySuffixList: ["of assassination"],
  },
  workbench: {
    enable: false,
    factor: 10,
    maxQuality: 1,
    repairArena: true,
    repairTurma: true,
    itemList1: [],
    itemList2: [],
  },
  auction: {
    enable: false,
    status: 0,
    timeOut: 0,
    statusEnable: 4,
    bidMax: 0,
    prefixList: [],
    suffixList: [],
    bidFood: false,
    coverAllies: false,
    ignoreBids: [],
    log: [],
    bidMercenary: false,
    minDex: 0,
    minAgi: 0,
    minInt: 0,
    searchGlad: false,
    searchMerc: false,
  },
  auctionM: {
    status: 0,
    timeOut: 0,
  },
  packages: {
    type: [],
    quality: [],
    useSmeltFilter: false,
    useCloths: false,
  },
  notification: {
    enable: false,
    token: "Your Token",
    device: [],
    smelt: {
      enable: true,
      timer: [],
    },
    forge: {
      enable: true,
      timer: [],
    },
    lvl: {
      enable: true,
    },
    auction: {
      enable: true,
      status: -1,
      statusM: -1,
      statusEnable: 0,
    },
  },
  gods: {
    enable: false,
    infernoUse: false,
    timer: [1],
    minerva: 3,
    diana: 3,
    mars: 3,
    merkur: 3,
    apollo: 3,
    vulcanus: 3,
  },
  checkDolls: {},
  language: {
    auctionStatus: {
      veryLong: "Muy Largo",
      long: "Largo",
      medium: "Medio",
      short: "Corto",
      veryShort: "Muy Corto",
    },
    boss: "Jefe",
  },
};

const info = {
  playerId(mnk) {
    let cookiePlayerId = document.cookie.match(
      new RegExp(mnk + "=(\\d+)", "i")
    );
    return cookiePlayerId ? cookiePlayerId[1] : this.resolveId(mnk);
  },

  resolveId(mnk) {
    jQuery.get(
      tools.link.full({
        mod: "overview",
        sh: tools.url.query("sh"),
      }),
      (p) => {
        let t = jQuery(p)
            .find("section > p")[1]
            .querySelector("b")
            .innerText.match(/\d+$/)[0],
          expires =
            "expires=" +
            new Date(
              new Date().getTime() + 365 * 24 * 60 * 60 * 1000
            ).toUTCString();
        document.cookie = mnk + "=" + t + ";" + expires + ";path=/";
        return t;
      }
    );
  },

  extension: {
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    extension: Browser.runtime.id,
    folder: Browser.extension.getURL("src"),
  },
  player: {},
  tabId: 0,

  async getGuildMarkedList(name) {
    let link = `${window.location.origin}/game/index.php`;

    let list = await fetch(
      `${link}?mod=guildMarket&submod=control&sh=${urlParams.get("sh")}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "es,en;q=0.9,cs;q=0.8,it;q=0.7",
          "cache-control": "max-age=0",
          priority: "u=0, i",
          referer:
            "https://s59-en.gladiatus.gameforge.com/game/index.php?mod=guildMarket&fl=0&fq=-1&f=0&qry=&seller=&s=pd&p=1&sh=c1af64935f5ad491dc534369727e491a",
          "sec-ch-ua": `"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"`,
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": `"Windows"`,
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
        },
        credentials: "include", // Incluye las cookies de sesión (si tienes una sesión activa)
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text(); // O `response.json()` si esperas JSON
      })
      .then((data) => {
        let buyList = data
          .split('<p class="scrollbox static">')[1]
          .trimStart()
          .split("<br />");

        let filteredList = buyList.filter((item) => {
          return item.includes("a " + name);
        });
        let first10Items = filteredList.slice(0, 10);

        return first10Items;
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });
    return list;
  },
  async getGuildMarkedItems() {
    let link = `${window.location.origin}/game/index.php`;

    let htmlText = await fetch(
      `${link}?mod=guildMarket&fl=0&fq=-1&f=0&qry=&seller=&s=p&p=1&sh=${urlParams.get(
        "sh"
      )}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });

    if (!htmlText) return [];

    // Analiza el HTML
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlText, "text/html");

    // Selecciona el tbody que contiene los formularios y filas
    let marketTable = doc.getElementById("market_table");
    let tbody = marketTable.children[0].children[0];
    // // Obtén todos los elementos dentro del tbody
    let elements = Array.from(tbody.children);

    // Arreglo para almacenar los datos extraídos
    let items = [];

    // Recorre los elementos para procesarlos de tres en tres (form, input, tr)
    for (let i = 1; i < elements.length; i += 10) {
      let tooltipText =
        elements[i + 9].children[0].children[0].getAttribute("data-tooltip");
      let itemName = tooltipText.match(/\[\[\["([^"]+)/);
      let sellerName = elements[i + 9].children[1].textContent.trim();
      if (sellerName === store.data.player.name) continue;

      let price = parseInt(
        elements[i + 9].children[2].textContent.trim().replace(".", "")
      );
      const goldValElement = document.getElementById("sstat_gold_val");
      const goldValString = goldValElement.textContent;
      const goldValue = parseFloat(
        goldValElement.textContent
          .replace(/\./g, "") // Elimina todos los puntos (separadores de miles)
          .replace(",", ".") // Reemplaza la coma (separador decimal) por un punto
      );
      if (
        price < parseInt(store.data.gold.goldMin) ||
        price > parseInt(store.data.gold.goldMax) ||
        price > goldValue
      )
        continue;

      // Crea un objeto con los datos de cada elemento
      let item = {
        buyId: elements[i + 1].value,
        sellerName: sellerName,
        price: price,
        itemName: tooltipText,
      };
      items.push(item);
    }
    return items;
  },
  buyGuildMarkedItem(buyId) {
    let link = `${window.location.origin}/game/index.php`;

    fetch(`${link}?mod=guildMarket&sh=${urlParams.get("sh")}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `buyid=${buyId}&qry=&seller=&f=0&fl=0&fq=-1&s=p&p=1&buy=Comprar`,
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then((data) => {
        // console.log(data);
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });
  },
  async searchPackage(tooltipText) {
    let link = `${window.location.origin}/game/index.php`;

    let htmlText = await fetch(
      `${link}?mod=packages&f=0&fq=-1&qry=&page=1&sh=${urlParams.get("sh")}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });

    if (!htmlText) return [];

    // Analiza el HTML
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlText, "text/html");
    const packageItems = doc.getElementsByClassName("packageItem");

    // Convierte la colección HTML en un array y filtra los que contienen el texto "Mercado" en el hijo especificado
    const itemsWithMercado = Array.from(packageItems).filter((item) => {
      // Encuentra el hijo con clase "sender ellipsis"
      const senderEllipsis = item.querySelector(".sender.ellipsis");

      // Verifica si el hijo existe y si su texto incluye "Mercado"
      return senderEllipsis && senderEllipsis.innerText.includes("Mercado");
    });

    let itemStorage = tooltipText.split(",");
    let itemFormValue;
    itemsWithMercado.forEach((element) => {
      let itemData = element.children[2].children[0]
        .getAttribute("data-tooltip")
        .split(",");
      if (
        itemData.length > 2 &&
        itemData[0] === itemStorage[0] &&
        itemData[2] === itemStorage[2]
      ) {
        itemFormValue = element.children[0].value;
      }
    });
    return itemFormValue;
  },
  async collectPackage(formId, position = { x: 1, y: 1 }) {
    try {
      let link = `${window.location.origin}/game/ajax.php`;

      const response = await fetch(
        `${link}?mod=inventory&submod=move&from=-${formId}&fromX=1&fromY=1&to=512&toX=${position.x}&toY=${position.y}&amount=1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `&a=1731046950722&sh=${urlParams.get("sh")}`,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
    } catch (error) {
      console.error("Error al mover el item:", error);
    }
  },
  async sellPackage(tooltipText, price) {
    let link = `${window.location.origin}/game/index.php`;

    let htmlText = await fetch(
      `${link}?mod=guildMarket&&sh=${urlParams.get("sh")}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });

    if (!htmlText) return [];

    // Analiza el HTML
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlText, "text/html");

    const sellBox = document.getElementById("market_sell").children[0];
    const inventory = Array.from(document.getElementById("inv").children);
    const priceBox = document.getElementById("preis");
    const time = document.getElementById("dauer");
    const sellForm = document.getElementById("sellForm");

    let itemStorage = tooltipText.split(",");
    inventory.forEach(async (element) => {
      let itemData = element.getAttribute("data-tooltip").split(",");

      let tempItemData = itemData[0];
      let tempItemStorage = itemStorage[0];

      let tempItemData2 = itemData[2];
      let tempItemStorage2 = itemStorage[2];

      // Convierte caracteres Unicode de escape a texto normal
      tempItemData = tempItemData.replace(/\\u([\dA-Fa-f]{4})/g, (_, group) =>
        String.fromCharCode(parseInt(group, 16))
      );
      tempItemStorage = tempItemStorage.replace(
        /\\u([\dA-Fa-f]{4})/g,
        (_, group) => String.fromCharCode(parseInt(group, 16))
      );

      tempItemData2 = tempItemData2.replace(/\\u([\dA-Fa-f]{4})/g, (_, group) =>
        String.fromCharCode(parseInt(group, 16))
      );
      tempItemStorage2 = tempItemStorage2.replace(
        /\\u([\dA-Fa-f]{4})/g,
        (_, group) => String.fromCharCode(parseInt(group, 16))
      );

      if (
        itemData.length > 2 &&
        tempItemData === tempItemStorage &&
        tempItemData2 === tempItemStorage2
      ) {
        // sellBox.appendChild(element);
        this.moverParaVender(element, sellBox);
        setTimeout(() => {
          priceBox.value = price;
          time.selectedIndex = 2;
        }, 2000);
        setTimeout(() => {
          document.getElementsByName("anbieten")[0].click();
        }, 3000);
      }
    });
  },
  moverParaVender(item, destino) {
    const objetivoRect = destino.getBoundingClientRect();
    const objetivoX = objetivoRect.left + window.pageXOffset;
    const objetivoY = objetivoRect.top + window.pageYOffset;
    const objetivoWidth = objetivoRect.width;
    const objetivoHeight = objetivoRect.height;

    // Obtener las dimensiones del elemento a arrastrar
    const elementoRect = item.getBoundingClientRect();
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
    // statusLog.innerText = "Seleccionado comida...";
    item.dispatchEvent(eventoMouseDown);

    // Crear un evento de 'mousemove' para mover el elemento hacia el centro del objetivo
    const eventoMouseMove = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: centroX,
      clientY: centroY,
    });
    // statusLog.innerText = "Moviendo comida...";
    item.dispatchEvent(eventoMouseMove);

    // Crear un evento de 'mouseup' en el objetivo para soltar el elemento
    const eventoMouseUp = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      clientX: centroX,
      clientY: centroY,
    });
    // statusLog.innerText = "Soltando comida...";
    destino.dispatchEvent(eventoMouseUp);

    // window.location.reload();
  },
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async searchFoodInVendor() {
    let link = `${window.location.origin}/game/index.php`;

    let htmlText = await fetch(
      `${link}?mod=inventory&sub=3&subsub=1&sh=${urlParams.get("sh")}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });

    if (!htmlText) return [];

    // Analiza el HTML
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlText, "text/html");
    let item = doc.getElementById("shop").children;
    return item[0];
  },
  async buyItem(item) {
    let link = `${window.location.origin}/game/ajax.php`;
    const positionX = item.getAttribute("data-position-x");
    const positionY = item.getAttribute("data-position-y");

    fetch(
      `${link}?mod=inventory&submod=move&from=305&fromX=${positionX}&fromY=${positionY}&to=512&toX=2&toY=1&amount=1&doll=1`,
      {
        method: "POST",

        body: `&a=1731079837606&sh=${urlParams.get("sh")}`,
      }
    )
      .then((response) => response.json())
      .then((data) => window.location.reload())
      .catch((error) => console.error("Error:", error));
  },
  async getWorkClothesCount() {
    let link = `${window.location.origin}/game/index.php`;

    let htmlText = await fetch(
      `${link}?mod=inventory&sub=3&subsub=1&sh=${urlParams.get("sh")}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });

    if (!htmlText) return [];

    // Analiza el HTML
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlText, "text/html");
    let tooltipData = doc
      .getElementsByName("bestechen")[0]
      .parentElement.children[1].children[0].getAttribute("data-tooltip");

    // Parseamos el JSON del atributo `data-tooltip`
    let tooltipArray = JSON.parse(tooltipData);

    if (!tooltipArray) return 0;

    // Aplanamos el array y buscamos el texto que contiene "Posees: "
    let poseeText = tooltipArray
      .flat(3) // Aplana el array a 3 niveles
      .find((item) => typeof item === "string" && item.includes("Posees: "));

    // Extraemos el número usando una expresión regular
    if (poseeText) {
      let poseeCantidad = poseeText.match(/Posees:\s(\d+)/)[1];
      return parseInt(poseeCantidad); // Debería mostrar "70"
    } else {
      console.log("No se encontró el texto 'Posees: '");
    }
  },
  async refreshVendor() {
    let link = `${window.location.origin}/game/index.php`;

    fetch(`${link}/?mod=inventory&sub=3&subsub=1&sh=${urlParams.get("sh")}`, {
      method: "POST",
      body: new URLSearchParams({
        bestechen: "Nuevos bienes",
      }),
    })
      .then((response) => response.text())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error));
  },

  async searchFootPackage() {
    let link = `${window.location.origin}/game/index.php`;
    let htmlText = await fetch(
      `${link}?mod=packages&f=7&sh=${urlParams.get("sh")}`,
      {
        method: "GET",
        credentials: "include",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .catch((error) => {
        console.error("Hubo un error con el fetch:", error);
      });
    if (!htmlText) return [];

    // Analiza el HTML
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlText, "text/html");
    const packageItems = doc.getElementsByClassName("packageItem");

    // Convierte la colección HTML en un array y filtra los que contienen el texto "Mercado" en el hijo especificado
    const items = Array.from(packageItems);
    return items?.[0]?.children?.[0]?.value || null;
  },
};
