/**
 * English Up - Sistema de Renderizado y Personalización de Avatares (Búho SENA)
 * Base única estándar: Búho Clásico (mascot-base.png).
 * Los aprendices personalizan a su búho agregando capas de accesorios: Sombreros, Ropa SENA e Ítems.
 */
(function (global) {
  "use strict";

  const ASSETS_PATH = "/assets/avatars";

  const AVATAR_CATALOG = {
    base: { id: "mascot-base", name: "Búho Clásico SENA", file: "mascot-base.png" },
    hats: [
      { id: "none", name: "Sin sombrero", file: null, icon: "🚫" },
      { id: "hat-sombrero-vueltiao", name: "Sombrero Vueltiao", file: "hat-sombrero-vueltiao.png", icon: "🇨🇴" },
      { id: "hat-sena-graduation", name: "Birrete SENA", file: "hat-sena-graduation.png", icon: "🎓" },
      { id: "hat-safety-helmet", name: "Casco Industrial", file: "hat-safety-helmet.png", icon: "⛑️" },
      { id: "hat-royal-crown", name: "Corona Real", file: "hat-royal-crown.png", icon: "👑" },
      { id: "hat-winter-beanie", name: "Gorro de Lana", file: "hat-winter-beanie.png", icon: "🧶" },
      { id: "accessory-gamer-headset", name: "Audífonos Gamer", file: "accessory-gamer-headset.png", icon: "🎧" },
    ],
    clothing: [
      { id: "none", name: "Sin ropa", file: null, icon: "🚫" },
      { id: "clothing-sena-vest", name: "Chaleco SENA", file: "clothing-sena-vest.png", icon: "🦺" },
      { id: "clothing-blue-hoodie", name: "Buzo Azul", file: "clothing-blue-hoodie.png", icon: "🧥" },
      { id: "clothing-lab-coat", name: "Bata Laboratorio", file: "clothing-lab-coat.png", icon: "🥼" },
      { id: "clothing-superhero-cape", name: "Capa Héroe", file: "clothing-superhero-cape.png", icon: "🦸" },
    ],
    items: [
      { id: "none", name: "Sin accesorio", file: null, icon: "🚫" },
      { id: "item-sena-notebook", name: "Cuaderno SENA", file: "item-sena-notebook.png", icon: "📒" },
      { id: "item-pencil", name: "Lápiz Creativo", file: "item-pencil.png", icon: "✏️" },
    ],
  };

  /**
   * Normaliza la configuración del avatar asegurando siempre la base estándar del Búho SENA.
   */
  function parseAvatar(avatarInput) {
    const defaultAvatar = {
      preset: "mascot-base",
      hat: "hat-sombrero-vueltiao",
      clothing: "clothing-sena-vest",
      item: null,
    };

    if (!avatarInput) {
      return defaultAvatar;
    }
    if (typeof avatarInput === "object") {
      return {
        preset: "mascot-base",
        hat: avatarInput.hat || null,
        clothing: avatarInput.clothing || null,
        item: avatarInput.item || null,
      };
    }
    const trimmed = String(avatarInput).trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          preset: "mascot-base",
          hat: parsed.hat || null,
          clothing: parsed.clothing || null,
          item: parsed.item || null,
        };
      } catch {
        // Fallback a base con accesorios por defecto
      }
    }
    return defaultAvatar;
  }

  /**
   * Convierte el objeto avatar a cadena JSON limpia para transporte y almacenamiento.
   */
  function serializeAvatar(avatarObj) {
    if (!avatarObj) return "";
    const parsed = parseAvatar(avatarObj);
    return JSON.stringify({
      preset: "mascot-base",
      hat: parsed.hat || null,
      clothing: parsed.clothing || null,
      item: parsed.item || null,
    });
  }

  /**
   * Genera el HTML de las capas superpuestas del avatar sobre el Búho Base estándar.
   * @param {string|object} avatarData
   * @param {'xs'|'sm'|'md'|'lg'|'xl'|'preview'|'podium'} size
   * @param {string} extraClass
   */
  function renderAvatarHtml(avatarData, size = "md", extraClass = "") {
    const avatar = parseAvatar(avatarData);

    let layersHtml = `<img class="avatar-layer avatar-layer--base" src="${ASSETS_PATH}/mascot-base.png" alt="Búho SENA" loading="lazy" decoding="async">`;

    if (avatar.clothing && avatar.clothing !== "none") {
      const cMeta = AVATAR_CATALOG.clothing.find((c) => c.id === avatar.clothing);
      if (cMeta && cMeta.file) {
        layersHtml += `<img class="avatar-layer avatar-layer--clothing layer-${cMeta.id}" src="${ASSETS_PATH}/${cMeta.file}" alt="${cMeta.name}" loading="lazy">`;
      }
    }
    if (avatar.hat && avatar.hat !== "none") {
      const hMeta = AVATAR_CATALOG.hats.find((h) => h.id === avatar.hat);
      if (hMeta && hMeta.file) {
        layersHtml += `<img class="avatar-layer avatar-layer--hat layer-${hMeta.id}" src="${ASSETS_PATH}/${hMeta.file}" alt="${hMeta.name}" loading="lazy">`;
      }
    }
    if (avatar.item && avatar.item !== "none") {
      const iMeta = AVATAR_CATALOG.items.find((i) => i.id === avatar.item);
      if (iMeta && iMeta.file) {
        layersHtml += `<img class="avatar-layer avatar-layer--item layer-${iMeta.id}" src="${ASSETS_PATH}/${iMeta.file}" alt="${iMeta.name}" loading="lazy">`;
      }
    }

    return `<div class="avatar-box avatar-box--${size} ${extraClass}" data-preset="mascot-base" aria-label="Avatar: Búho SENA">
      <div class="avatar-stage">
        ${layersHtml}
      </div>
    </div>`;
  }

  /**
   * Monta el avatar dentro de un contenedor del DOM.
   */
  function mountAvatar(container, avatarData, size = "md", extraClass = "") {
    if (!container) return;
    container.innerHTML = renderAvatarHtml(avatarData, size, extraClass);
  }

  /**
   * Genera una combinación aleatoria divertida de accesorios para el Búho estándar.
   */
  function getRandomAvatar() {
    const hatPool = AVATAR_CATALOG.hats.filter((h) => h.id !== "none");
    const clothPool = AVATAR_CATALOG.clothing.filter((c) => c.id !== "none");
    const itemPool = AVATAR_CATALOG.items;

    // 85% de probabilidad de tener sombrero y ropa
    const randomHat = Math.random() < 0.85 ? hatPool[Math.floor(Math.random() * hatPool.length)].id : null;
    const randomCloth = Math.random() < 0.85 ? clothPool[Math.floor(Math.random() * clothPool.length)].id : null;
    // 50% de probabilidad de tener ítem en mano
    const randomItem = Math.random() < 0.5 ? itemPool[Math.floor(Math.random() * itemPool.length)].id : null;

    return {
      preset: "mascot-base",
      hat: randomHat,
      clothing: randomCloth,
      item: randomItem && randomItem !== "none" ? randomItem : null,
    };
  }

  /**
   * Inicializa el componente interactivo Avatar Studio dentro de un contenedor.
   * Pestañas exclusivas para accesorios del Búho SENA estándar (Sombreros, Ropa, Ítems).
   */
  function createStudio(container, options = {}) {
    if (!container) return null;
    let currentAvatar = parseAvatar(options.initialAvatar);
    let activeTab = "hats"; // 'hats' | 'clothing' | 'items'

    function updatePreview() {
      const previewStage = container.querySelector(".avatar-preview-display");
      if (previewStage) {
        previewStage.innerHTML = `
          ${renderAvatarHtml(currentAvatar, "preview")}
          <span class="avatar-preview-label">Búho SENA en vivo</span>
        `;
      }
      if (typeof options.onChange === "function") {
        options.onChange(currentAvatar, serializeAvatar(currentAvatar));
      }
    }

    function renderOptions() {
      const optionsPanel = container.querySelector(".avatar-options-panel");
      if (!optionsPanel) return;

      const items = AVATAR_CATALOG[activeTab] || [];
      optionsPanel.innerHTML = items
        .map((item) => {
          let isSelected = false;
          if (activeTab === "hats") {
            isSelected = (currentAvatar.hat || "none") === item.id;
          } else if (activeTab === "clothing") {
            isSelected = (currentAvatar.clothing || "none") === item.id;
          } else if (activeTab === "items") {
            isSelected = (currentAvatar.item || "none") === item.id;
          }

          return `
            <button type="button" class="avatar-option-btn ${isSelected ? "is-selected" : ""}" data-id="${item.id}" data-category="${activeTab}" aria-pressed="${isSelected}">
              <span class="avatar-option-icon">${item.icon || "✨"}</span>
              <span class="avatar-option-label">${item.name}</span>
            </button>
          `;
        })
        .join("");

      optionsPanel.querySelectorAll(".avatar-option-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const cat = btn.getAttribute("data-category");

          if (cat === "hats") {
            currentAvatar.hat = id === "none" ? null : id;
          } else if (cat === "clothing") {
            currentAvatar.clothing = id === "none" ? null : id;
          } else if (cat === "items") {
            currentAvatar.item = id === "none" ? null : id;
          }

          renderOptions();
          updatePreview();
        });
      });
    }

    container.innerHTML = `
      <div class="avatar-studio">
        <div class="avatar-studio-header">
          <h3 class="avatar-studio-title">🦉 Personaliza tu Búho SENA</h3>
          <div class="avatar-studio-actions">
            <button type="button" class="avatar-tool-btn btn-random-avatar" title="Generar combinación al azar">
              🎲 Aleatorio
            </button>
            <button type="button" class="avatar-tool-btn btn-reset-avatar" title="Quitar todos los accesorios">
              🔄 Búho Base
            </button>
          </div>
        </div>
        <div class="avatar-preview-display" aria-live="polite"></div>
        <div class="avatar-tabs" role="tablist">
          <button type="button" class="avatar-tab-btn is-active" data-tab="hats" role="tab" aria-selected="true">
            🎩 Sombreros
          </button>
          <button type="button" class="avatar-tab-btn" data-tab="clothing" role="tab" aria-selected="false">
            🦺 Ropa SENA
          </button>
          <button type="button" class="avatar-tab-btn" data-tab="items" role="tab" aria-selected="false">
            ✏️ Accesorios
          </button>
        </div>
        <div class="avatar-options-panel" role="region" aria-label="Opciones de accesorios para el búho"></div>
      </div>
    `;

    const tabButtons = container.querySelectorAll(".avatar-tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        activeTab = btn.getAttribute("data-tab");
        renderOptions();
      });
    });

    const randomBtn = container.querySelector(".btn-random-avatar");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        currentAvatar = getRandomAvatar();
        renderOptions();
        updatePreview();
      });
    }

    const resetBtn = container.querySelector(".btn-reset-avatar");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        currentAvatar = { preset: "mascot-base", hat: null, clothing: null, item: null };
        renderOptions();
        updatePreview();
      });
    }

    renderOptions();
    updatePreview();

    return {
      getAvatar: () => ({ ...currentAvatar }),
      getSerialized: () => serializeAvatar(currentAvatar),
      setAvatar: (newAvatar) => {
        currentAvatar = parseAvatar(newAvatar);
        renderOptions();
        updatePreview();
      },
    };
  }

  const avatarApi = {
    CATALOG: AVATAR_CATALOG,
    parseAvatar,
    serializeAvatar,
    renderAvatarHtml,
    mountAvatar,
    getRandomAvatar,
    createStudio,
  };

  global.EnglishUpAvatars = avatarApi;
  global.EnglishDayAvatars = avatarApi;
})(window);
