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
    method: 1,
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

const Browser = typeof browser === "undefined" ? chrome : browser;
const manifest = Browser.runtime.getManifest();
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
};
