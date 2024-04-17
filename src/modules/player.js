const player = {
  health: 0,
  expeditionPoints: 0,
  dungeonPoints: 0,
  initPlayer: () => {
    player.health = parseInt(
      document
        .getElementById("header_values_hp_percent")
        .innerText.split("%")[0]
    );

    player.expeditionPoints = parseInt(
      document.getElementById("expeditionpoints_value_point").innerText
    );
    player.dungeonPoints = parseInt(
      document.getElementById("dungeonpoints_value_point").innerText
    );
  },
};
