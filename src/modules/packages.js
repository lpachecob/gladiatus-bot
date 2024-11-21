const packages = {
  init: function () {
    let packagesInterface = document.getElementsByTagName("article")[0];
    let nuevoDiv = document.createElement("div");
    nuevoDiv.innerHTML = `
        <h2 class="section-header" style="cursor: pointer; margin-top: -2px;">
            Atajos
        </h2>
        <section style="display: block;" class="packages-section" id="packages_tools"></section>
    `;
    packagesInterface.insertBefore(
      nuevoDiv,
      packagesInterface.children[0].nextSibling
    );
  },
};
