const { createApp } = Vue;

createApp({
  data() {
    const defaultCrosshair = {
      style: 2,
      tstyle: false,
      size: 2,
      thickness: 1,
      gap: 3,
      outline: false,
      outlineThickness: 0,
      dot: false,
      followRecoil: false,
      alpha: 255,
    };

    const defaultViewmodel = {
      fov: 68,
      offsetX: 2.5,
      offsetY: 1,
      offsetZ: -1.5,
    };

    const defaultRgb = {
      r: 0,
      g: 255,
      b: 0,
    };

    return {
      stickyEnabled: true,
      
      // Main settings
      sensitivity: 2.5,
      radarHUDScale: 1.0,
      radarMapZoom: 0.7,
      output: "",
      hudColor: 9,
      rgb: {
        ...defaultRgb,
      },
      selectedPreset: "",
      crosshair: {
        ...defaultCrosshair,
      },
      viewmodel: {
        ...defaultViewmodel,
      },

      volumeMaster: 0.8, // Volume 0.0 - 1.0

      autoHelp: false,
      howHelp: false,
      fpsMax: 300,

      // Static data for reset
      defaultCrosshair,
      defaultViewmodel,
      defaultRgb,

      // Map images
      mapImages: [
        "./assets/maps/vertigo.png",
        "./assets/maps/overpass.png",
        "./assets/maps/nuke.png",
        "./assets/maps/ancient.png",
        "./assets/maps/train.png",
      ],
      presetColors: {
        white: {
          hex: "white",
          rgb: [255, 255, 255],
        },
        red: {
          hex: "red",
          rgb: [255, 0, 0],
        },
        lime: {
          hex: "lime",
          rgb: [0, 255, 0],
        },
        cyan: {
          hex: "cyan",
          rgb: [0, 255, 255],
        },
        yellow: {
          hex: "yellow",
          rgb: [255, 255, 0],
        },
        magenta: {
          hex: "magenta",
          rgb: [255, 0, 255],
        },
        orange: {
          hex: "orange",
          rgb: [255, 165, 0],
        },
        blue: {
          hex: "blue",
          rgb: [0, 0, 255],
        },
      },
      hudColorNames: {
        1: "White",
        3: "Light Blue",
        4: "Dark Blue",
        5: "Purple",
        6: "Red",
        7: "Orange",
        8: "Yellow",
        9: "Green",
        10: "Aqua",
        11: "Light Pink",
        12: "Pink",
        0: "Default",
      },
      currentImageIndex: 0,

      binds: {
        jump: ["SPACE", "", ""],
        fire: "MOUSE1",
        secondaryFire: "MOUSE2",
        toggleConsole: ".",
        mic: "q",
        viewmodelToggle: "l",
        scoreboard: "TAB",
        primaryWeapon: "MOUSE5",
        secondaryWeapon: "MOUSE4",
        meleeWeapon: "1",
        cycleGrenades: "4",
        explosives: "3",
        heGrenade: "h",
        flashbang: "z",
        smoke: "x",
        molotov: "v",
      },
    };
  },
  computed: {
    rgbString() {
      return `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},${this.crosshair.alpha / 255
        })`;
    },
    currentHudColorName() {
      return this.hudColorNames[this.hudColor] || "Unknown Color";
    },
    currentMapImage() {
      return this.mapImages[this.currentImageIndex];
    },
  },
  mounted() {
    // Initial draw when component mounts
    this.updateCanvasDimensions();
    this.drawCrosshair();

    // Add event listener for window resize
    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },
  watch: {
    rgb: {
      handler: "drawCrosshair",
      deep: true,
    },
    crosshair: {
      handler: "drawCrosshair",
      deep: true,
    },
    currentImageIndex: {
      handler: "drawCrosshair", // Redraw crosshair when image changes
    },
  },
  methods: {
    updateCanvasDimensions() {
      const canvas = document.getElementById("crosshairCanvas");
      const parent = canvas.parentElement;

      if (canvas && parent) {
        // Get the actual computed CSS size of the canvas wrapper
        const rect = parent.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // Get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;

        // Set the internal canvas dimensions to be scaled by DPR for sharpness
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }
    },
    handleResize() {
      // When the window resizes, update canvas dimensions and redraw
      this.updateCanvasDimensions();
      this.drawCrosshair();
    },
    drawCrosshair() {
      const canvas = document.getElementById("crosshairCanvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      // Ensure canvas internal resolution matches the displays pixel density
      this.updateCanvasDimensions();

      // Get the device pixel ratio (DPR)
      const dpr = window.devicePixelRatio || 1;

      // Reset any previous transformations on the drawing context
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Apply the DPR scaling to the context
      ctx.scale(dpr, dpr);

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const center_x = canvas.width / dpr / 2;
      const center_y = canvas.height / dpr / 2;

      const referenceWidth = 930;
      const referenceHeight = 180;

      // Calculate a 'viewport' specific scaling factor.
      const logicalCanvasWidth = canvas.width / dpr;
      const logicalCanvasHeight = canvas.height / dpr;
      const scaleFactor = Math.min(
        logicalCanvasWidth / referenceWidth,
        logicalCanvasHeight / referenceHeight
      );

      // Calculate visual crosshair properties, now using the combined scaleFactor
      const visualSize = this.crosshair.size * 5 * scaleFactor;
      const visualThickness = this.crosshair.thickness * 2.5 * scaleFactor;
      const visualGap = this.crosshair.gap * scaleFactor;
      const totalGap = visualGap + visualThickness / 2; // Total gap includes half thickness for proper spacing

      const outline = this.crosshair.outline;
      const outlineThickness = this.crosshair.outlineThickness * scaleFactor;

      // The main color with alpha
      const mainColorWithAlpha = `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b
        },${this.crosshair.alpha / 255})`;

      // Helper function to draw a rectangle with optional outline
      const drawRect = (x, y, width, height) => {
        if (outline) {
          ctx.fillStyle = "black";
          // Draw outline slightly larger than the main rectangle
          ctx.fillRect(
            x - outlineThickness,
            y - outlineThickness,
            width + outlineThickness * 2,
            height + outlineThickness * 2
          );
        }
        ctx.fillStyle = mainColorWithAlpha;
        ctx.fillRect(x, y, width, height);
      };

      // T-style
      if (!this.crosshair.tstyle) {
        drawRect(
          center_x - visualThickness / 2,
          center_y - totalGap - visualSize,
          visualThickness,
          visualSize
        );
        drawRect(
          center_x - visualThickness / 2,
          center_y + totalGap,
          visualThickness,
          visualSize
        );
        drawRect(
          center_x - totalGap - visualSize,
          center_y - visualThickness / 2,
          visualSize,
          visualThickness
        );
        drawRect(
          center_x + totalGap,
          center_y - visualThickness / 2,
          visualSize,
          visualThickness
        );
      } else {
        drawRect(
          center_x - totalGap - visualSize,
          center_y - visualThickness / 2,
          visualSize,
          visualThickness
        );
        drawRect(
          center_x + totalGap,
          center_y - visualThickness / 2,
          visualSize,
          visualThickness
        );
        drawRect(
          center_x - visualThickness / 2,
          center_y + totalGap,
          visualThickness,
          visualSize
        );
      }

      // Draw the center dot if enabled
      if (this.crosshair.dot) {
        const dotSize = Math.max(1 / dpr, visualThickness);
        const halfDot = dotSize / 2;

        if (outline) {
          ctx.fillStyle = "black";
          ctx.fillRect(
            center_x - halfDot - outlineThickness,
            center_y - halfDot - outlineThickness,
            dotSize + outlineThickness * 2,
            dotSize + outlineThickness * 2
          );
        }
        ctx.fillStyle = mainColorWithAlpha;
        ctx.fillRect(center_x - halfDot, center_y - halfDot, dotSize, dotSize);
      }
    },
    selectPreset(name) {
      const color = this.presetColors[name];
      if (!color) return;
      [this.rgb.r, this.rgb.g, this.rgb.b] = color.rgb;
      this.selectedPreset = name;
    },
    // Generate configs
    generate() {
      let cfg = `// CS2 Settings - https://mobbi.dev\n\n`;
      cfg += `// Crosshair\n`;
      cfg += `cl_crosshairstyle "${this.crosshair.style}"\n`;
      cfg += `cl_crosshair_t "${this.crosshair.tstyle ? 1 : 0}"\n`;
      cfg += `cl_crosshaircolor_r "${this.rgb.r}"\n`;
      cfg += `cl_crosshaircolor_g "${this.rgb.g}"\n`;
      cfg += `cl_crosshaircolor_b "${this.rgb.b}"\n`;
      cfg += `cl_crosshairsize "${this.crosshair.size}"\n`;
      cfg += `cl_crosshairthickness "${this.crosshair.thickness}"\n`;
      cfg += `cl_crosshairgap "${this.crosshair.gap}"\n`;
      cfg += `cl_crosshair_drawoutline "${this.crosshair.outline ? 1 : 0}"\n`;
      cfg += `cl_crosshair_outlinethickness "${this.crosshair.outlineThickness}"\n`;
      cfg += `cl_crosshair_recoil "${this.crosshair.followRecoil ? 1 : 0}"\n`;
      cfg += `cl_crosshairusealpha "1"\n`;
      cfg += `cl_crosshairalpha "${this.crosshair.alpha}"\n`;
      cfg += `cl_crosshairdot "${this.crosshair.dot ? 1 : 0}"\n\n`;
      cfg += `// Sensitivity\n`;
      cfg += `sensitivity "${this.sensitivity}"\n\n`;
      cfg += `// Hud\n`;
      cfg += `cl_hud_color "${this.hudColor}" // ${this.currentHudColorName}\n\n`;
      cfg += `// Radar\n`;
      cfg += `cl_hud_radar_scale ${this.radarHUDScale}\n`;
      cfg += `cl_radar_scale ${this.radarMapZoom}\n\n`;
      cfg += `// Viewmodel\n`;
      cfg += `viewmodel_fov ${this.viewmodel.fov}\n`;
      cfg += `viewmodel_offset_x ${this.viewmodel.offsetX}\n`;
      cfg += `viewmodel_offset_y ${this.viewmodel.offsetY}\n`;
      cfg += `viewmodel_offset_z ${this.viewmodel.offsetZ}\n\n`;
      cfg += `// Volume\n`;
      cfg += `volume "${this.volumeMaster}"\n\n`;
      cfg += `// Miscellaneous\n`;
      cfg += `cl_autohelp ${this.autoHelp ? "1" : "0"}\n`;
      cfg += `cl_showhelp ${this.showHelp ? "1" : "0"}\n`;
      cfg += `fps_max ${this.fpsMax}\n\n`;
      cfg += `// Binds\n`;

      cfg += `// Jump binds (space, mwheelup, mwheeldown)\n`;
      this.binds.jump.forEach((key) => {
        if (key && key.trim() !== "") {
          cfg += `bind "${key.trim()}" "+jump"\n`;
        }
      });

      const singleBinds = [
        { key: this.binds.fire, command: "+attack", description: "Fire" },
        {
          key: this.binds.secondaryFire,
          command: "+attack2",
          description: "Secondary Fire",
        },
        {
          key: this.binds.toggleConsole,
          command: "toggleconsole",
          description: "Toggle Console",
        },
        {
          key: this.binds.mic,
          command: "+voicerecord",
          description: "Use Microphone",
        },
        {
          key: this.binds.viewmodelToggle,
          command: "toggleviewmodel",
          description: "Switch Viewmodel Hand",
        },
        {
          key: this.binds.scoreboard,
          command: "+showscores",
          description: "Scoreboard",
        },
        {
          key: this.binds.primaryWeapon,
          command: "slot1",
          description: "Primary Weapon",
        },
        {
          key: this.binds.secondaryWeapon,
          command: "slot2",
          description: "Secondary Weapon",
        },
        {
          key: this.binds.meleeWeapon,
          command: "slot3",
          description: "Melee Weapon",
        },
        {
          key: this.binds.cycleGrenades,
          command: "slot4",
          description: "Cycle Grenades",
        },
        {
          key: this.binds.explosives,
          command: "slot5",
          description: "Explosives & Traps",
        },
        {
          key: this.binds.heGrenade,
          command: "use weapon_hegrenade",
          description: "HE Grenade",
        },
        {
          key: this.binds.flashbang,
          command: "use weapon_flashbang",
          description: "Flashbang",
        },
        {
          key: this.binds.smoke,
          command: "use weapon_smokegrenade",
          description: "Smoke Grenade",
        },
        {
          key: this.binds.molotov,
          command: "use weapon_molotov; use weapon_incgrenade",
          description: "Molotov Cocktail",
        },
      ];

      for (const bind of singleBinds) {
        if (bind.key && bind.key.trim() !== "") {
          cfg += `bind "${bind.key.trim()}" "${bind.command}"  // ${bind.description
            }\n`;
        }
      }

      cfg += `\n`;

      this.output = cfg;
    },
    // Download .cfg
    download() {
      if (!this.output) return;
      const blob = new Blob([this.output], {
        type: "text/plain",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "autoexec.cfg";
      link.click();
    },
    // Reset settings
    resetSettings() {
      if (
        confirm(
          "This will reset all your configs to default. Are you sure you want to continue?"
        )
      ) {
        this.sensitivity = 2.5;
        this.radarHUDScale = 1.0;
        this.radarMapZoom = 0.7;
        this.output = "";
        this.hudColor = 9;
        this.rgb = {
          ...this.defaultRgb,
        };
        this.selectedPreset = "";
        this.crosshair = {
          ...this.defaultCrosshair,
        };
        this.viewmodel = {
          ...this.defaultViewmodel,
        };

        this.volumeMaster = 0.8;

        this.autoHelp = false;
        this.showHelp = false;
        this.fpsMax = 300;

        this.currentImageIndex = 0;

        this.binds = {
          jump: ["SPACE", "", ""],
          fire: "MOUSE1",
          secondaryFire: "MOUSE2",
          toggleConsole: ".",
          mic: "q",
          viewmodelToggle: "l",
          scoreboard: "TAB",
          primaryWeapon: "MOUSE5",
          secondaryWeapon: "MOUSE4",
          meleeWeapon: "1",
          cycleGrenades: "4",
          explosives: "3",
          heGrenade: "h",
          flashbang: "z",
          smoke: "x",
          molotov: "v",
        };
      }
    },
    nextImage() {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.mapImages.length;
    },
    prevImage() {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.mapImages.length) %
        this.mapImages.length;
    },
  },
}).mount("#app");
