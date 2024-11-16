const url = new URL(window.location.href);
const queryString = url.search;
const urlParams = new URLSearchParams(queryString);
let healing = false;
let savingGold = false;
let checkQuests = true;

if (localStorage.gtools) {
  store.init();
} else {
  localStorage.gtools = JSON.stringify(storeDefault);
  store.init();
}
let statusLog;
const gTools = {
  menu() {
    Menu.setNewItem(
      [
        { name: "control-start", value: "bot" },
        { name: "heal-timeout", value: "bot.refreshTime" },
        { name: "heal-timeout-switch", value: "bot.refresh" },
      ],
      [
        {
          name: "status",
          value: () => {
            console.log("status");
          },
        },
        {
          name: "control",
          value: (button) => {
            const submenu =
              button.parentElement.parentElement.getElementsByClassName(
                "gt-submenu-item"
              )[0];
            submenu.style.display =
              submenu.style.display === "flex" ? "none" : "flex";
          },
        },
        {
          name: "control-start",
          value: () => {
            store.data.bot.enable = !store.data.bot.enable;
            window.location.reload();
          },
        },
        {
          name: "heal-timeout",
          value: (button) => {},
        },
        {
          name: "heal-timeout-switch",
          value: () => {
            store.data.bot.refresh = !store.data.bot.refresh;
          },
        },
      ],
      [
        {
          name: "bot",
          value: (button, target) => {
            button.checked = store.data[target].enable;
          },
        },
        {
          name: "bot.refreshTime",
          value: (button, target) => {
            button.value = store.data.bot.delay;
            button.addEventListener("keyup", () => {
              store.data.bot.delay = button.value;
            });
          },
        },
        {
          name: "bot.refresh",
          value: (button, target) => {
            button.checked = store.data.bot.refresh;
          },
        },
      ]
    );
  },
  main() {
    if (store.data.bot.enable) {
      saveGold.start();
      if (!savingGold) heal.start();
      if (!healing && !savingGold) {
        setTimeout(() => {
          expedition.start();
          info.sleep(1000)
          arena.start();
          info.sleep(1000)
          turma.start();
          info.sleep(1000)
          eventExpedition.start();
          info.sleep(1000)
          quests.start();
        }, 2000);
      }
      if (store.data.bot.refresh) {
        Timer.setCountdownMessage(
          store.data.bot.delay,
          "Tiempo de espera: ",
          statusLog,
          () => {
            window.location.reload();
          }
        );
      }
    }
  },

  preload() {
    let link = `${window.location.origin}/game/index.php`;
    jQuery.get(`${link}?mod=overview&sh=${urlParams.get("sh")}`, (p) => {
      store.data.player.name = jQuery(p).find(".playername_achievement")[0]
        ? jQuery(p).find(".playername_achievement")[0].innerText.match(/\w+/)[0]
        : jQuery(p).find(".playername")[0].innerText.match(/\w+/)[0];
    });

    loader.css("gs-tools");
    this.menu();
    saveGold.menu();
    quests.menu();
    expedition.menu();
    heal.menu();
    arena.menu();
    turma.menu();
    eventExpedition.menu();
    // packages.init();
    menu.start(() => {
      player.initPlayer();
      expedition.init();
      statusLog = document.getElementById("status-log");
      this.main();
    });
  },
};
const relogin = {
  start() {
    this.stuckHandler = setTimeout(() => {
      window.location.reload();
    }, 34);
    this.relogin();
  },

  relogin() {
    if (document.getElementById("joinGame")) {
      Browser.runtime.sendMessage(
        {
          cmd: "relogin",
        },
        (r) => {
          if (r) {
            document.querySelector("#joinGame button") &&
              document.querySelector("#joinGame button").click();
            setTimeout(() => {
              if (document.getElementById("serverlist-header")) {
                Array.from(
                  document
                    .querySelector(".rt-tbody")
                    .querySelectorAll(".rt-tr-group")
                ).forEach((e) => {
                  let server =
                      e.querySelector(".server-name-cell div").innerText ==
                      r.server,
                    country =
                      e
                        .querySelector(".country-cell span")
                        .classList[0].includes(r.country) ||
                      e
                        .querySelector(".country-cell span")
                        .classList[1].includes(r.country);

                  if (server && country) {
                    clearTimeout(relogin.stuckHandler);
                    e.querySelector("button").click();
                  }
                });
              } else setTimeout(relogin.relog, 3e3);
            }, 3e3);
          }
        }
      );
    } else setTimeout(this.relogin, 3e3);
  },
};
document.addEventListener("readystatechange", (e) => {
  switch (document.readyState) {
    case "interactive":
      if (document.getElementById("icon_highscore")) gTools.preload();
      break;

    case "complete":
      break;
  }
});
