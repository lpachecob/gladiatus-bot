const getStatsPlayer = {
  async requestSearchPlayerByName(country, server, name) {
    // Post data y obtener resultados de búsqueda
    let html;
    try {
      const response = await fetch(
        `https://s${server}-${country}.gladiatus.gameforge.com/game/index.php?mod=highscore&submod=suche`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ s: "s", xs: name }).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }

      html = await response.text(); // O response.json() si esperas un JSON
    } catch (error) {
      // En caso de error en la solicitud
      return {
        error: true,
        message: "Nuestros trabajadores monos no pudieron completar la tarea.",
      };
    }
    // Reducir cadena eliminando datos inútiles
    html = html.substring(40000, html.length - 2000);

    // Comprobar si está en modo de respaldo
    if (getStatsPlayer.isServerInBackUpMode(html)) {
      return {
        error: true,
        backup: true,
        message: "El servidor Gladiatus está en modo de respaldo.",
      };
    }

    // Coincidir patrones de resultados
    const regex =
      /<a\s+href="index\.php\?mod=player&p=(\d+)[^>]+>\s*([^<]+)<\/a>(<a href="index\.php\?mod=guild&i=(\d+)[^>]+>\s*([^<]+)<\/a>)*/g;
    const matches = [...html.matchAll(regex)];
    // Comprobar si no se encontró jugador
    let index = 0;
    let found = matches.length > 0 && matches[0][2] == name;

    if (found) {
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][2] === name) {
          found = true;
          index = i;
          break;
        }
      }
    }
    if (!found) {
      return {
        error: true,
        message: "Jugador no encontrado.",
      };
    }

    // Crear objeto jugador
    const player = {
      name: matches[0][2],
      id: matches[0][1],
    };

    // Insertar gremio si existe
    if (matches[0][4] && matches[0][4].length > 0) {
      player.guild = {
        tag: matches[0][5],
        id: matches[0][4],
      };
    }

    // Información del servidor del juego
    player.game = {
      country: country,
      server: server,
    };

    // Retornar el objeto
    return player;
  },
  async requestGetPlayerProfileData(country, server, id) {
    // Obtener el código de la página de perfil
    const url = `https://s${server}-${country}.gladiatus.gameforge.com/game/index.php?mod=player&p=${id}`;

    let html;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      html = await response.text();
    } catch (error) {
      return {
        error: true,
        message: "Nuestros trabajadores monos no pudieron completar la tarea.",
      };
    }

    // Reducir la cadena eliminando datos inútiles
    // html = html.substring(40000, html.length - 100);

    // Comprobar si hay un respaldo
    if (getStatsPlayer.isServerInBackUpMode(html)) {
      return {
        error: true,
        backup: true,
        message: "El servidor de Gladiatus está en modo de respaldo.",
      };
    }

    // Comprobar si el jugador no fue encontrado
    const found =
      /<article>[^<]*<h2 class="section-header">[^<]*<\/h2>[^<]*<section style="[^"]+" id="exitMessage">[^<]+<\/section>[^<]*<\/article>/.test(
        html
      );

    // Crear objeto del jugador
    const player = {
      id: id,
      name: null,
      profile: {},
      game: {
        country: country,
        server: server,
      },
    };

    // Obtener el nombre del jugador
    const nameMatch =
      /<div class="playername(_achievement)* ellipsis">([^<]+)<\/div>/.exec(
        html
      );
    if (!nameMatch)
      return { error: true, message: "Error de análisis interno [001]." };
    player.name = nameMatch[2].replace(/\s+/g, "");

    // Obtener la imagen del jugador
    const avatarMatch =
      /<div id="avatar" class="player_picture"[^>]*>[^<]*(<[^>]*>)/.exec(html);
    if (!avatarMatch)
      return { error: true, message: "Error de análisis interno [002]." };
    const imgMatch = /background-image: *url\(([^)]+)\);*/.exec(avatarMatch[1]);
    if (!imgMatch)
      return { error: true, message: "Error de análisis interno [003]." };
    player.img = `https://s${server}-${country}.gladiatus.gameforge.com/game/${imgMatch[1]}`;

    let customImg = false;
    const customImgMatch = /##GTI=(http[^#]+)##/.exec(html);
    if (customImgMatch) {
      if (/\.(png|jpeg|jpg|gif|bmp)$/.test(customImgMatch[1])) {
        player.img = customImgMatch[1];
        customImg = true;
      }
    }

    if (!customImg) {
      const costumeMatches = [
        ...html.matchAll(/"avatar avatar_costume_part"[^>]+/g),
      ];
      if (costumeMatches.length) {
        player.img = [];
        for (const imagePart of costumeMatches) {
          const bgMatch = /background-image: *url\(([^)]+)\);*/.exec(
            imagePart[0]
          );
          player.img.push(
            `https://s${server}-${country}.gladiatus.gameforge.com/game/${bgMatch[1]}`
          );
        }
      }
    }

    // Obtener información de la guild
    const guildMatch =
      /<a href="index.php\\?mod=guild&i=(\d+)">([^ ]+) \[([^<]+)\]<\/a>/.exec(
        html
      );
    if (guildMatch) {
      player.guild = {
        id: guildMatch[1],
        name: guildMatch[2],
        tag: guildMatch[3],
      };
    }

    // Obtener el nivel del jugador
    const levelMatch =
      /<span id="char_level" class="charstats_value22">(\d+)<\/span>/.exec(
        html
      );
    if (!levelMatch)
      return { error: true, message: "Error de análisis interno [004]." };
    player.profile.level = levelMatch[1];

    // Obtener vida del jugador
    const lifeMatch =
      /<div\s+class="charstats_bg"\s+id="char_leben_tt"\s+data-tooltip="\[\[\[\[[^,]+,&quot;(\d+)\s*\\\/\s*(\d+)&quot;/.exec(
        html
      );
    if (!lifeMatch)
      return { error: true, message: "Error de análisis interno [005]." };
    player.profile.life = [lifeMatch[1], lifeMatch[2]];

    // Obtener experiencia del jugador
    const expMatch =
      /<div\s+class="charstats_bg"\s+id="char_exp_tt"\s+data-tooltip="\[\[\[\[[^,]+,&quot;(\d+)\s*\\\/\s*(\d+)&quot;/.exec(
        html
      );
    if (!expMatch)
      return { error: true, message: "Error de análisis interno [006]." };
    player.profile.experience = [expMatch[1], expMatch[2]];

    // Obtener fuerza, habilidad, agilidad, constitución, carisma e inteligencia
    const attributes = [
      "strength",
      "skill",
      "agility",
      "constitution",
      "charisma",
      "intelligence",
    ];
    for (let i = 0; i < attributes.length; i++) {
      const attrMatch = new RegExp(
        `<span id="char_f${i}" class="charstats_value">(\\d+)<\\/span>`
      ).exec(html);
      if (!attrMatch)
        return {
          error: true,
          message: `Error de análisis interno [00${7 + i}].`,
        };
      player.profile[attributes[i]] = attrMatch[1];
    }

    // Obtener armadura del jugador
    const armorMatch =
      /<span id="char_panzer" class="charstats_value22">(\d+)<\/span>/.exec(
        html
      );
    if (!armorMatch)
      return { error: true, message: "Error de análisis interno [013]." };
    player.profile.armor = armorMatch[1];

    // Obtener daño del jugador
    const damageMatch =
      /<span id="char_schaden" class="charstats_value22">(\d+)\s*-\s*(\d+)<\/span>/.exec(
        html
      );
    if (!damageMatch)
      return { error: true, message: "Error de análisis interno [014]." };
    player.profile.damage = [damageMatch[1], damageMatch[2]];

    // Obtener curación del jugador
    const healingMatch =
      /<span id="char_healing" class="charstats_value22">(\d+)<\/span>/.exec(
        html
      );
    if (!healingMatch)
      return { error: true, message: "Error de análisis interno [015]." };
    player.profile.healing = healingMatch[1];
    // Encontrar críticos
    let criticalhtml = html.substring(52000, 61388).split(",");
    if (!criticalhtml || criticalhtml.length <= 10)
      return { error: true, message: "Error de análisis interno [016]." };

    player.profile["avoid-critical-points"] = criticalhtml[51].substring(
      0,
      criticalhtml[51].length - 1
    );
    player.profile["block-points"] = criticalhtml[67].substring(
      0,
      criticalhtml[67].length - 1
    );
    player.profile["critical-points"] = criticalhtml[102].substring(
      0,
      criticalhtml[102].length - 1
    );
    player.profile["critical-healing"] = criticalhtml[129].substring(
      0,
      criticalhtml[129].length - 1
    );
    player.profile["avoid-critical-percent"] = criticalhtml[63].substring(
      6,
      criticalhtml[63].length - 9
    );
    player.profile["block-percent"] = criticalhtml[47].substring(
      6,
      criticalhtml[47].length - 9
    );
    player.profile["critical-percent"] = criticalhtml[114].substring(
      6,
      criticalhtml[114].length - 9
    );
    player.profile["critical-healing-percent"] = criticalhtml[141].substring(
      6,
      criticalhtml[141].length - 9
    );

    // Buffs
    player.profile.buffs = {
      minerva: false, // No se puede detectar
      mars: false, // No se puede detectar
      apollo: false, // No se puede detectar
      honour_veteran: false,
      honour_destroyer: false, // No se puede detectar
    };

    const levelFactor = player.profile.level - 8;
    const adjustedLevelFactor = Math.max(levelFactor, 2);

    // Detectar el buff de honor del veterano
    if (
      player.profile["critical-percent"] -
        Math.round(
          (player.profile["critical-points"] * 52) / adjustedLevelFactor / 100
        ) >=
      10
    ) {
      player.profile.buffs.honour_veteran = true;
    }

    // Detectar el buff del destructor
    if (
      player.profile["critical-healing-percent"] -
        Math.round(
          (player.profile["critical-healing"] * 52) / adjustedLevelFactor / 100
        ) >=
      10
    ) {
      player.profile.buffs.honour_destroyer = true;
    }

    return { error: false, player: player };
  },
  async requestGetPlayerStatisticsData(country, server, id) {
    // Obtener el código de la página de estadísticas
    let response;
    try {
      response = await fetch(
        `https://s${server}-${country}.gladiatus.gameforge.com/game/index.php?mod=player&submod=stats&p=${id}`,
        {
          method: "GET",
        }
      );
    } catch (error) {
      return {
        error: true,
        message: "Our monkeys-workers failed to complete the task.",
      };
    }

    const html = await response.text();

    // En caso de error en la solicitud
    if (!html) {
      return {
        error: true,
        message: "Our monkeys-workers failed to complete the task.",
      };
    }

    // Reducir la cadena eliminando datos inútiles
    const trimmedHtml = html.substring(45000, html.length - 2000);

    // Comprobar si el servidor está en modo de copia de seguridad
    if (isSeverInBackUpMode(trimmedHtml)) {
      return {
        error: true,
        backup: true,
        message: "Gladiatus server is in backup mode.",
      };
    }

    // Crear objeto del jugador
    const player = {
      id: id,
      statistics: {},
      game: {
        country: country,
        server: server,
      },
    };

    // Obtener estadísticas del jugador
    const statisticsCode = [];
    const regex =
      /<th>[^<]+<\/th>\s*<td class="stats_value">(\d+\.*\d*\.*\d*\.*\d*)\s*</g;
    let match;

    while ((match = regex.exec(trimmedHtml)) !== null) {
      statisticsCode.push(match[1]);
    }

    if (statisticsCode.length === 0) {
      return { error: true, message: "Internal parse error." };
    }

    // Contar el índice
    let index = 0;

    const statisticsOrderNames = {
      arena: [
        "Battles",
        "Wins",
        "Defeats",
        "Draws",
        "Issued hit points",
        "Taken hit points",
        "Gold captured",
        "Gold lost",
        "Wins in a row",
      ],
      turma: [
        "Battles",
        "Wins",
        "Defeats",
        "Draws",
        "Gold captured",
        "Gold lost",
        "Wins in a row",
      ],
      quests: ["Completed quests", "Completed quests with a time limit"],
      victories: ["Points", "Honour", "Fame", "People mugged"],
    };

    // Arena
    for (const statName of statisticsOrderNames.arena) {
      const statisticKey = statName
        .replace(/[()]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
      player.statistics.arena = player.statistics.arena || {};
      player.statistics.arena[statisticKey] = statisticsCode[index].replace(
        /[.,]/g,
        ""
      );
      index++;
    }

    // Turma
    for (const statName of statisticsOrderNames.turma) {
      const statisticKey = statName
        .replace(/[()]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
      player.statistics.turma = player.statistics.turma || {};
      player.statistics.turma[statisticKey] = statisticsCode[index].replace(
        /[.,]/g,
        ""
      );
      index++;
    }

    // Quests
    for (const statName of statisticsOrderNames.quests) {
      const statisticKey = statName
        .replace(/[()]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
      player.statistics.quests = player.statistics.quests || {};
      player.statistics.quests[statisticKey] = statisticsCode[index].replace(
        /[.,]/g,
        ""
      );
      index++;
    }

    // Victories
    for (const statName of statisticsOrderNames.victories) {
      const statisticKey = statName
        .replace(/[()]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
      player.statistics.victories = player.statistics.victories || {};
      player.statistics.victories[statisticKey] = statisticsCode[index].replace(
        /[.,]/g,
        ""
      );
      index++;
    }

    // Retornar el objeto
    return player;
  },
  async requestGetPlayerAchievementsData(country, server, id) {
    // Obtener el código de la página de logros
    let response = await fetch(
      `https://s${server}-${country}.gladiatus.gameforge.com/game/index.php?mod=player&submod=achievements&p=${id}`,
      {
        method: "GET",
      }
    );

    // En caso de error en la solicitud
    if (!response.ok) {
      // Retornar error de página no encontrada
      return {
        error: true,
        message: "Our monkeys-workers failed to complete the task.",
      };
    }

    let html = await response.text();

    // Reducir la cadena eliminando datos inútiles
    html = html.substring(45000, html.length - 2000);

    // Comprobar si está en modo de respaldo
    if (getStatsPlayer.isServerInBackUpMode(html)) {
      return {
        error: true,
        backup: true,
        message: "Gladiatus server is in backup mode.",
      };
    }

    // Crear objeto del jugador
    const player = {
      id: id,
      achievements: {},
      game: {
        country: country,
        server: server,
      },
    };

    // Obtener logros del jugador
    const achievementsCode = [];
    const found = html.match(
      /<div class="achievement_detail_current">\s*(\d+\.?\d*\.?\d*)\s*\/\s*(\d+\.?\d*\.?\d*)\s*<\/div>/g
    );

    if (!found) {
      return { error: true, message: "Internal parse error." };
    }

    // Contador de índice
    let index = 0;

    const achievementsOrderNames = {
      general: [
        "Earn gold",
        "Train strength",
        "Train dexterity",
        "Train mobility",
        "Train constitution",
        "Train Charisma",
        "Train intelligence",
        "Collect honour",
        "Collect honour (Provinciarum)",
        "Get fame",
        "Get fame (Provinciarum)",
        "Go to work",
      ],
      items: [
        "Find items",
        "Find blue items",
        "Find purple items",
        "Find orange items",
      ],
      social: [
        "Increase Circle of Buddies",
        "Look at profiles",
        "Be the centre of attention",
      ],
      guild: [
        "Donate gold",
        "Store items",
        "Have yourself healed",
        "Pray in the temple",
        "Fight with the guild",
        "Win guild battles",
        "Store recipes",
        "Activate recipes",
        "Catch dungeon bosses",
        "Defeat dungeon bosses",
      ],
      trade: [
        "Sell items",
        "Buy items",
        "Sell market items",
        "Buy market items",
        "Win auctions",
      ],
      arena: [
        "Win in the arena",
        "Win in the Arena (Provinciarum)",
        "Deal out damage",
        "Accept damage",
        "Absorb damage",
        "Win in succession",
        "Win arena pot",
        "Kill gladiators",
        "Die in the arena",
        "Win naked",
      ],
      turma: [
        "Win in Circus Turma",
        "Defeat in Circus Turma (Provinciarum)",
        "Deal out damage",
        "Accept damage",
        "Absorb damage",
        "Win in succession",
        "Win Circus Turma Pot",
      ],
      dungeons: ["Dungeon successfully completed"],
    };

    // General
    achievementsOrderNames.general.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.general = player.achievements.general || {};
        player.achievements.general[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Items
    achievementsOrderNames.items.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.items = player.achievements.items || {};
        player.achievements.items[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Social
    achievementsOrderNames.social.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.social = player.achievements.social || {};
        player.achievements.social[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Guild
    achievementsOrderNames.guild.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.guild = player.achievements.guild || {};
        player.achievements.guild[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Trade
    achievementsOrderNames.trade.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.trade = player.achievements.trade || {};
        player.achievements.trade[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Arena
    achievementsOrderNames.arena.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.arena = player.achievements.arena || {};
        player.achievements.arena[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Turma
    achievementsOrderNames.turma.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.turma = player.achievements.turma || {};
        player.achievements.turma[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Dungeons
    achievementsOrderNames.dungeons.forEach((achievement, i) => {
      const achivName = achievement
        .replace(/[() ]/g, "")
        .toLowerCase()
        .replace(/ /g, "_");
      if (achievementsCode[1][index] !== achievementsCode[2][index]) {
        player.achievements.dungeons = player.achievements.dungeons || {};
        player.achievements.dungeons[achivName] = achievementsCode[1][
          index
        ].replace(/[.,]/g, "");
      }
      index++;
    });

    // Retornar el objeto
    return player;
  },
  async requestGetPlayerTurmaData(country, server, id) {
    // Array de jugadores
    const turmaData = {
      id: id,
      players: [],
      game: {
        country: country,
        server: server,
      },
    };

    // Obtener datos del jugador principal
    let data = await getStatsPlayer.requestGetPlayerTurmaPlayerData(
      country,
      server,
      id,
      0,
      true
    );
    if (data.error) return data;
    const team = data.team;
    data.player.role = team[0];
    turmaData.players.push(data.player);

    // Obtener jugador 1
    if (team[1]) {
      data = await getStatsPlayer.requestGetPlayerTurmaPlayerData(
        country,
        server,
        id,
        1
      );
      if (data.error) return data;
      data.player.role = team[1];
      turmaData.players.push(data.player);
    }

    // Obtener jugador 2
    if (team[2]) {
      data = await getStatsPlayer.requestGetPlayerTurmaPlayerData(
        country,
        server,
        id,
        2
      );
      if (data.error) return data;
      data.player.role = team[2];
      turmaData.players.push(data.player);
    }

    // Obtener jugador 3
    if (team[3]) {
      data = await getStatsPlayer.requestGetPlayerTurmaPlayerData(
        country,
        server,
        id,
        3
      );
      if (data.error) return data;
      data.player.role = team[3];
      turmaData.players.push(data.player);
    }

    // Obtener jugador 4
    if (team[4]) {
      data = await getStatsPlayer.requestGetPlayerTurmaPlayerData(
        country,
        server,
        id,
        4
      );
      if (data.error) return data;
      data.player.role = team[4];
      turmaData.players.push(data.player);
    }

    return turmaData;
  },
  async requestGetPlayerTurmaPlayerData(
    country,
    server,
    id,
    playerIndex,
    getOtherPlayers = false
  ) {
    // Obtener código de la página de perfil
    let html;
    try {
      const response = await fetch(
        `https://s${server}-${country}.gladiatus.gameforge.com/game/index.php?mod=player&doll=${
          playerIndex + 2
        }&p=${id}`,
        {
          method: "GET",
        }
      );
      html = await response.text();
    } catch (error) {
      // En caso de error en la solicitud
      return {
        error: true,
        message: "Nuestros trabajadores monos no pudieron completar la tarea.",
      };
    }

    // Reducir cadena eliminando datos inútiles
    const htmlStartPos = html.indexOf('<div id="content">');
    html = html.substring(
      htmlStartPos !== -1 ? htmlStartPos : 30000,
      html.length - 2000
    );

    // Comprobar si está en modo de respaldo
    if (getStatsPlayer.isServerInBackUpMode(html)) {
      return {
        error: true,
        backup: true,
        message: "El servidor Gladiatus está en modo de respaldo.",
      };
    }

    // Crear objeto jugador
    const data = {
      player: {},
      team: {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
      },
    };

    // Obtener nombre del jugador
    let found =
      /<div class="playername(_achievement)* ellipsis">([^<]+)<\/div>/.exec(
        html
      );
    if (!found) {
      return { error: true, message: "Internal parse error [T001]." };
    }
    data.player.name = found[2].trim();

    // Obtener nivel del jugador
    found =
      /<span id="char_level" class="charstats_value22">(\d+)<\/span>/.exec(
        html
      );
    if (!found) {
      return { error: true, message: "Internal parse error [T002]." };
    }
    data.player.level = found[1];

    // Obtener vida del jugador
    found =
      /<div\s+class="charstats_bg"\s+id="char_leben_tt"\s+data-tooltip="\[\[\[\[[^,]+,&quot;(\d+)\s*\\\/\s*(\d+)&quot;/.exec(
        html
      );
    if (!found) {
      return { error: true, message: "Internal parse error [T003]." };
    }
    data.player.life = [found[1], found[2]];

    // Obtener atributos del jugador (fuerza, habilidad, agilidad, constitución, carisma, inteligencia)
    const attributes = [
      "strength",
      "skill",
      "agility",
      "constitution",
      "charisma",
      "intelligence",
    ];
    for (let i = 0; i < attributes.length; i++) {
      found = new RegExp(
        `<span id="char_f${i}" class="charstats_value">(\\d+)<\\/span>`
      ).exec(html);
      if (!found) {
        return { error: true, message: `Internal parse error [T00${i + 4}].` };
      }
      data.player[attributes[i]] = found[1];
    }

    // Obtener armadura
    found =
      /<span id="char_panzer" class="charstats_value22">(\d+)<\/span>/.exec(
        html
      );
    if (!found) {
      return { error: true, message: "Internal parse error [T010]." };
    }
    data.player.armor = found[1];

    // Obtener daño
    found =
      /<span id="char_schaden" class="charstats_value22">(\d+)\s*-\s*(\d+)<\/span>/.exec(
        html
      );
    if (!found) {
      return { error: true, message: "Internal parse error [T011]." };
    }
    data.player.damage = [found[1], found[2]];

    // Obtener curación
    found =
      /<span id="char_healing" class="charstats_value22">(\d+)<\/span>/.exec(
        html
      );
    if (!found) {
      return { error: true, message: "Internal parse error [T012]." };
    }
    data.player.healing = found[1];

    // Obtener amenaza
    found =
      /<span id="char_threat" class="charstats_value22">(\d+)<\/span>/.exec(
        html
      );
    if (!found) {
      return { error: true, message: "Internal parse error [T013]." };
    }
    data.player.threat = found[1];

    // Encontrar críticos
    found =
      /&quot;,(\d+)],\s*\[&quot;#BA9700&quot;,&quot;#BA9700&quot;\\]\\]/g.exec(
        html
      );
    if (!found || found.length <= 10) {
      return { error: true, message: "Internal parse error [016]." };
    }

    // Obtener puntos críticos del jugador
    data.player["avoid-critical-points"] = found[1][7];
    data.player["block-points"] = found[1][8];
    data.player["critical-points"] = found[1][9];
    data.player["critical-healing"] = found[1][12] ? found[1][12] : 0;

    if (getOtherPlayers) {
      // Obtener roles
      const roles = getStatsPlayer.requestTurmaRolesTranslation(country);

      // Jugador principal
      found = /<div class="charmercpic doll2"\s*data-tooltip="([^"]+)"/.exec(
        html
      );
      if (!found) {
        return { error: true, message: "Internal parse error [T002R]." };
      }
      data.team[0] = getStatsPlayer.requestTurmaResolveRole(roles, found[1]);

      // Obtener otros jugadores
      for (let i = 1; i <= 4; i++) {
        found = new RegExp(`<div class="charmercpic doll${i + 2}"/`).exec(html);
        if (found) {
          found = new RegExp(
            `<div class="charmercpic doll${i + 2}"\\s*data-tooltip="([^"]+)"/`
          ).exec(html);
          if (!found) {
            return {
              error: true,
              message: `Internal parse error [T00${i + 2}R].`,
            };
          }
          data.team[i] = getStatsPlayer.requestTurmaResolveRole(
            roles,
            found[1]
          );
        }
      }
    }

    // Retornar el objeto
    return data;
  },
  requestTurmaResolveRole(roles, html) {
    const hasRoles = {
      isRoleTank: false,
      isRoleDps: false,
      isRoleHealer: false,
      isRoleOut: false,
      isRoleUnknown: false,
    };

    // Decodificar el HTML y convertirlo en un objeto JSON
    const decodedHtml = JSON.parse(getStatsPlayer.htmlspecialcharsDecode(html));
    const roleHtml = decodedHtml[0][0][0];

    // Buscar el rol del jugador
    const roleMatch =
      /<font style=font-size:smaller;color:#DDDDDD>([^<]+)<\/font>/.exec(
        roleHtml
      );
    if (!roleMatch) {
      hasRoles.isRoleUnknown = true;
      return hasRoles;
    }
    const roleTranslation = roleMatch[1];

    // Determinar el rol del jugador
    switch (roleTranslation) {
      case roles.tank:
        hasRoles.isRoleTank = true;
        break;
      case roles.dps:
        hasRoles.isRoleDps = true;
        break;
      case roles.healer:
        hasRoles.isRoleHealer = true;
        break;
      case roles.out:
        hasRoles.isRoleOut = true;
        break;
      default:
        hasRoles.isRoleUnknown = true;
        break;
    }

    return hasRoles;
  },
  requestTurmaRolesTranslation(country) {
    switch (country) {
      case "ar":
        return {
          tank: "Misión: Ocupate de vos mismo",
          dps: "Misión: Distribuí el daño",
          healer: "Misión: Curá a los miembros de tu grupo",
          out: "Misión: No te lleves",
        };
      case "ba":
        return {
          tank: "Zadatak: Usmjeri pozornost prema sebi.",
          dps: "Zadatak: Isperi štetu",
          healer: "Zadatak: Izlječi grupu",
          out: "Zadatak: Nemoj uzeti sa",
        };
      case "br":
        return {
          tank: "Missão: Atenção direta a si",
          dps: "Missão: Prato de danos",
          healer: "Missão: Curar membros do grupos",
          out: "Missão: Não tome com",
        };
      case "dk":
        return {
          tank: "Opgave: Rette opmærksomheden mod én selv",
          dps: "Opgave: Uddel skade",
          healer: "Opgave: Heal gruppemedlemmer",
          out: "Opgave: Tag ikke med",
        };
      case "de":
        return {
          tank: "Aufgabe: Aufmerksamkeit auf sich ziehen",
          dps: "Aufgabe: Schaden austeilen",
          healer: "Aufgabe: Gruppenmitglieder heilen",
          out: "Aufgabe: Nicht mitnehmen",
        };
      case "ee":
        return {
          tank: "Retk: Otsene tähelepanu endale",
          dps: "Retk: Ründesse",
          healer: "Retk: Ravi grupi liikmeid",
          out: "Retk: Ära võta ühes",
        };
      case "es":
        return {
          tank: "Misión: Llamar la atención",
          dps: "Misión: Reparte el daño",
          healer: "Misión: Curar miembros del grupo",
          out: "Misión: Sin utilizar",
        };
      case "fr":
        return {
          tank: "Mission : Attirer l`attention sur soi",
          dps: "Mission : Infliger des dégâts",
          healer: "Mission : Soigner les membres du groupe",
          out: "Mission : Ne pas prendre avec soi",
        };
      case "it":
        return {
          tank: "Incarico: Attrae l`attenzione su di sé",
          dps: "Incarico: Distribuisce i danni",
          healer: "Incarico: Guarisce i membri del gruppo",
          out: "Incarico: Disattivato",
        };
      case "lv":
        return {
          tank: "Uzdevums: Pievērs uzmanību pats sev",
          dps: "Uzdevums: Izpostīt bojājumu",
          healer: "Uzdevums: Dziedināt grupas biedrus",
          out: "Uzdevums: Neņem ar",
        };
      case "lt":
        return {
          tank: "Užduotis: Tiesioginis dėmesys į save",
          dps: "Užduotis: Dalinti žalą",
          healer: "Užduotis: Pagydyti grupės narius",
          out: "Užduotis: Neimti su",
        };
      case "hu":
        return {
          tank: "Feladat: Ellenfél figyelmét magára vonja",
          dps: "Feladat: Ellenfél támadása",
          healer: "Feladat: Csapat tagjainak gyógyítása",
          out: "Feladat: Tétlen",
        };
      case "mx":
        return {
          tank: "Tarea: Atención directa a uno mismo",
          dps: "Tarea: Reparta el daño",
          healer: "Tarea: Cura a los miembros del grupo",
          out: "Tarea: No tomes",
        };
      case "nl":
        return {
          tank: "Quest: Richt de aandacht op jezelf",
          dps: "Quest: Schade verdelen",
          healer: "Quest: Groepsleden genezen",
          out: "Quest: Niet meenemen",
        };
      case "no":
        return {
          tank: "Ekspedisjon: Diriger oppmerksomhet til seg selv",
          dps: "Ekspedisjon: Server ut skade",
          healer: "Ekspedisjon: Helbred gruppe medlemmer",
          out: "Ekspedisjon: Ikke ta med",
        };
      case "pl":
        return {
          tank: "Zadanie: Prowokuj przeciwnika",
          dps: "Zadanie: Atakuj",
          healer: "Zadanie: Uzdrawiaj członków grupy",
          out: "Zadanie: Usuń z grupy",
        };
      case "pt":
        return {
          tank: "Missão: Chama a atenção para si mesmo",
          dps: "Missão: Reparte o dano",
          healer: "Missão: Cura os membros do grupo",
          out: "Missão: Não tome com",
        };
      case "ro":
        return {
          tank: "Cercetare: Atentie directa de sine",
          dps: "Cercetare: Distribuie daunele",
          healer: "Cercetare: Vindeca membrii grupului",
          out: "Cercetare: Fara a folosi",
        };
      case "sk":
        return {
          tank: "Úloha: Upútať pozornosť",
          dps: "Úloha: Rozdávať zranenia",
          healer: "Úloha: Liečiť",
          out: "Úloha: Nevziať",
        };
      case "fi":
        return {
          tank: "Tehtävä: Kerää huomion itseensä",
          dps: "Tehtävä: Tekee vauriota",
          healer: "Tehtävä: Parantaa ryhmän jäseniä",
          out: "Tehtävä: Ei oteta mukaan",
        };
      case "se":
        return {
          tank: "Uppgift: Tar emot skada",
          dps: "Uppgift: Dela ut skada",
          healer: "Uppgift: Läker gruppmedlemmar",
          out: "Uppgift: Ta inte med",
        };
      case "tr":
        return {
          tank: "Görev: Dikkati kendi üzerine çekmek",
          dps: "Görev: Hasarı paylaştır",
          healer: "Görev: Grup üyelerini iyileştir",
          out: "Görev: Beraberinde alma",
        };
      case "us":
        return {
          tank: "Task: Direct attention to oneself",
          dps: "Task: Dish out damage",
          healer: "Task: Heal group members",
          out: "Task: Do not take with",
        };
      case "en":
        return {
          tank: "Quest: Direct attention to oneself",
          dps: "Quest: Dish out damage",
          healer: "Quest: Heal group members",
          out: "Quest: Do not take with",
        };
      case "cz":
        return {
          tank: "Úkol: Přitáhni na sebe pozornost",
          dps: "Úkol: Rozdávej rány",
          healer: "Úkol: Uzdrav členy družiny",
          out: "Úkol: Nezahrávej si s",
        };
      case "gr":
        return {
          tank: "Αποστολή Πρόσεχε τον εαυτό σου",
          dps: "Αποστολή Προβλεπόμενη ζημιά",
          healer: "Αποστολή Θεραπεύστε τα μέλη της ομάδας σας",
          out: "Αποστολή Μη πάρεις μαζί",
        };
      case "bg":
        return {
          tank: "Куест: Насочи вниманието към себе си",
          dps: "Куест: Прави поражение",
          healer: "Куест: Лекувайте членове на групата",
          out: "Куест: Не вземай участие",
        };
      case "ru":
        return {
          tank: "Задание: Защищать",
          dps: "Задание: Наносить урон",
          healer: "Задание: Лечить членов группы",
          out: "Задание: Не использовать",
        };
      case "il":
        return {
          tank: "משימה: תשומת לב על עצמו",
          dps: "משימה: נזק במנות",
          healer: "משימה: רפא חברי קבוצה",
          out: "משימה: אל תקח עם",
        };
      case "ae":
        return {
          tank: "مهمة: إثارة الانتباه",
          dps: "مهمة: توزيع الضرر",
          healer: "مهمة: معالجة أعضاء المجموعة",
          out: "مهمة: لا تأخذه معك",
        };
      case "tw":
        return {
          tank: "任務: 吸引攻擊",
          dps: "任務: 實施攻擊",
          healer: "任務: 治療小組成員",
          out: "任務: 不攜帶",
        };
      case "vn":
        return {
          tank: "Nhiệm vụ: Tập trung sự chú ý vào bản thân",
          dps: "Nhiệm vụ: Chia sẻ sát thương",
          healer: "Nhiệm vụ: Chữa lành thành viên trong nhóm",
          out: "Nhiệm vụ: Không mang theo",
        };
      default:
        return {
          tank: "Unknown",
          dps: "Unknown",
          healer: "Unknown",
          out: "Unknown",
        };
    }
  },
  // Función auxiliar para decodificar HTML
  htmlspecialcharsDecode(html) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  },
  // Validar país
  requestValidateCountry(country) {
    switch (country) {
      // 31 servidores
      case "ar":
      case "ba":
      case "br":
      case "dk":
      case "de":
      case "ee":
      case "es":
      case "fr":
      case "it":
      case "lv":
      case "lt":
      case "hu":
      case "mx":
      case "nl":
      case "no":
      case "pl":
      case "pt":
      case "ro":
      case "sk":
      case "fi":
      case "se":
      case "tr":
      case "us":
      case "en":
      case "cz":
      case "gr":
      case "bg":
      case "ru":
      case "il":
      case "ae":
      case "tw":
        return true;
      default:
        return false;
    }
  },
  // Validar servidor
  requestValidateServer(server) {
    return /^[1-9][0-9]*$/.test(server);
  },
  // Validar nombre del jugador
  requestValidateName(name) {
    return /^[^~#&\[\]{}|\/'";:?,<>]{3,15}$/.test(name);
  },
  // Validar ID del jugador
  requestValidateId(id) {
    return /^[1-9][0-9]*$/.test(id);
  },
  // Si el servidor está en modo de respaldo
  isServerInBackUpMode(html) {
    return html.includes('<h2 id="logoGladiatus_infobox"></h2>');
  },

  async getPlayerData(player, actions) {
    let player_data;

    player_data = await getStatsPlayer.requestSearchPlayerByName(
      player.country,
      player.server,
      player.name
    );

    // Profile Action
    if (!actions.profile) {
      // Obtener los datos del perfil del jugador
      const data = await getStatsPlayer.requestGetPlayerProfileData(
        player.country,
        player.server,
        player_data.id
      );

      // En caso de error, devolver el mensaje de error
      if (data.error) {
        return data;
      }

      // Sobrescribir los datos antiguos
      player_data = data.player; // Asegúrate de acceder a 'data.player' si 'data' contiene un objeto con la propiedad 'player'
    }

    // Statistics Action
    if (actions.statistics) {
      // Obtener los datos de estadísticas del jugador
      const data = await getStatsPlayer.requestGetPlayerStatisticsData(
        player.country,
        player.server,
        player_data.id
      );

      // En caso de error, devolver el mensaje de error
      if (data.error) {
        return data;
      }

      // Sobrescribir los datos antiguos
      player_data.statistics = data.statistics; // Asegúrate de que 'data' contenga una propiedad 'statistics'
    }

    // Statistics Action
    if (actions.achievements) {
      // Obtener los datos de logros del jugador
      const data = await getStatsPlayer.requestGetPlayerAchievementsData(
        player.country,
        player.server,
        player_data.id
      );
      // En caso de error, retornar mensaje de error
      if (data.error) {
        return data;
      }
      // Sobrescribir los datos antiguos
      player_data.achievements = data.achievements;
    }

    // Turma Action
    if (actions.turma) {
      // Obtener los datos de turma del jugador
      const data = await getStatsPlayer.requestGetPlayerTurmaData(
        player.country,
        player.server,
        player_data.id
      );
      // En caso de error, retornar mensaje de error
      if (data.error) {
        return data;
      }
      // Sobrescribir los datos antiguos
      player_data.turma = data;
    }

    return player_data;
  },
};

const arenaSimulator = {
  // Simulate a Battle
  arenaSimulatorBattle(
    attackerStats,
    defenderStats,
    lifeMode = "current",
    battleRounds = 15,
    reports = true
  ) {
    // Select Players Life
    let attackerLife = attackerStats.profile.life[0];
    let defenderLife = defenderStats.profile.life[0];
    if (lifeMode === "full") {
      attackerLife = attackerStats.profile.life[1];
      defenderLife = defenderStats.profile.life[1];
    } else if (lifeMode === "ignore") {
      attackerLife = Infinity;
      defenderLife = Infinity;
    }

    // Prepare report
    const reporting = reports !== null;
    let report = reporting ? null : [];

    if (reporting) report.push([]);

    let scoreAttacker = 0;
    let scoreDefender = 0;
    let rounds = 0;
    while (rounds < battleRounds && attackerLife > 0 && defenderLife > 0) {
      let reportRound = reporting ? null : [];

      // Attacker
      // Single hit
      let hit = arenaSimulator.arenaSimulatorHitSimulation(
        attackerStats,
        defenderStats
      );
      scoreAttacker += hit[1];
      defenderLife -= hit[1];

      // Stop if dead
      if (defenderLife <= 0) {
        scoreAttacker += defenderLife;
        if (reporting) {
          reportRound.push([1, 2, hit[0], hit[1] + defenderLife]);
          report.push(reportRound);
        }
        break;
      } else {
        if (reporting) reportRound.push([1, 1, hit[0], hit[1]]);
      }

      // Double hit
      if (Math.random() * 100 <= attackerStats["double-hit-chance"]) {
        hit = arenaSimulator.arenaSimulatorHitSimulation(
          attackerStats,
          defenderStats
        );
        scoreAttacker += hit[1];
        defenderLife -= hit[1];

        // Stop if dead
        if (defenderLife <= 0) {
          scoreAttacker += defenderLife;
          if (reporting) {
            reportRound.push([1, 2, hit[0], hit[1] + defenderLife]);
            report.push(reportRound);
          }
          break;
        } else {
          if (reporting) reportRound.push([1, 1, hit[0], hit[1]]);
        }
      }

      // Defender
      hit = arenaSimulator.arenaSimulatorHitSimulation(
        defenderStats,
        attackerStats
      );
      scoreDefender += hit[1];
      attackerLife -= hit[1];

      // Stop if dead
      if (attackerLife <= 0) {
        scoreDefender += attackerLife;
        if (reporting) {
          reportRound.push([2, 2, hit[0], hit[1] + attackerLife]);
          report.push(reportRound);
        }
        break;
      } else {
        if (reporting) reportRound.push([2, 1, hit[0], hit[1]]);
      }

      // Double hit
      if (Math.random() * 100 <= defenderStats["double-hit-chance"]) {
        hit = arenaSimulator.arenaSimulatorHitSimulation(
          defenderStats,
          attackerStats
        );
        scoreDefender += hit[1];
        attackerLife -= hit[1];

        // Stop if dead
        if (attackerLife <= 0) {
          scoreDefender += attackerLife;
          if (reporting) {
            reportRound.push([2, 2, hit[0], hit[1] + attackerLife]);
            report.push(reportRound);
          }
          break;
        } else {
          if (reporting) reportRound.push([2, 1, hit[0], hit[1]]);
        }
      }

      // Report round
      if (reporting) report.push(reportRound);

      // Round x was finished
      rounds++;
    }

    if (attackerLife < 0) attackerLife = 0;
    if (defenderLife < 0) defenderLife = 0;
    const score = scoreAttacker - scoreDefender;

    // Report battle
    report[0] = [
      // Attacker
      [scoreAttacker, attackerLife],
      // Defender
      [scoreDefender, defenderLife],
    ];
    if (reporting) reports.push(report);

    // Battle Won
    if (defenderLife <= 0 || score > 0) {
      return 1;

      // Battle Draw
    } else if (score === 0) {
      return 0;

      // Battle Lost
    } else {
      return -1;
    }
  },
  // Simulate a hit
  arenaSimulatorHitSimulation(playerA, playerB) {
    let hit;
    if (Math.random() * 100 <= playerA["hit-chance"]) {
      if (Math.random() * 100 <= playerA["critical-chance"]) {
        if (Math.random() * 100 <= playerB["avoid-critical-chance"]) {
          hit = [3, arenaSimulator.getRandomDamage(playerA, playerB)];
        } else {
          hit = [2, arenaSimulator.getRandomDamage(playerA, playerB) * 2];
        }
      } else {
        hit =
          Math.random() * 100 <= playerB["block-chance"]
            ? [4, arenaSimulator.getRandomDamage(playerA, playerB) / 2]
            : [1, arenaSimulator.getRandomDamage(playerA, playerB)];
      }
    } else {
      hit = [5, 0];
    }

    if (hit[1] < 0) hit[1] = 0;
    return hit;
  },

  getRandomDamage(playerA, playerB) {
    return (
      Math.floor(
        Math.random() * (playerA.damage[1] - playerA.damage[0] + 1) +
          playerA.damage[0]
      ) -
      Math.floor(
        Math.random() *
          (playerB["armor-absorve"][1] - playerB["armor-absorve"][0] + 1) +
          playerB["armor-absorve"][0]
      )
    );
  },
  async test() {
    let playerArena = {
      country: "en",
      server: "59",
      name: "LxE",
      id: null,
    };
    let arenaDefender = {
      country: "en",
      server: "51",
      name: "GREG",
      id: null,
    };
    let options = {
      profile: false,
      statistics: false,
      achievements: false,
      turma: false,
    };
    let attacker;
    let defender;
    await getStatsPlayer.getPlayerData(playerArena, options).then((resolve) => {
      attacker = resolve;
    });

    await getStatsPlayer
      .getPlayerData(arenaDefender, options)
      .then((resolve) => {
        defender = resolve;
      });

    let result = arenaSimulator.arenaSimulatorBattle(attacker, defender);
  },
};

// arenaSimulator.test();
