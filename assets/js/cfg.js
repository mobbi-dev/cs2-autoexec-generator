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
      showHelp: false,
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
      copySuccess: false,
    };
  },
  created() {
    this.loadSettings();
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
      handler() {
        this.drawCrosshair();
        this.saveSettings();
      },
      deep: true,
    },
    crosshair: {
      handler() {
        this.drawCrosshair();
        this.saveSettings();
      },
      deep: true,
    },
    currentImageIndex: {
      handler() {
        this.drawCrosshair();
        this.saveSettings();
      }, 
    },
    stickyEnabled(isStickyEnabled) {
      this.saveSettings();
    },
    sensitivity() { this.saveSettings(); },
    radarHUDScale() { this.saveSettings(); },
    radarMapZoom() { this.saveSettings(); },
    hudColor() { this.saveSettings(); },
    viewmodel: {
        handler() { this.saveSettings(); },
        deep: true
    },
    volumeMaster() { this.saveSettings(); },
    autoHelp() { this.saveSettings(); },
    showHelp() { this.saveSettings(); },
    fpsMax() { this.saveSettings(); },
    binds: {
        handler() { this.saveSettings(); },
        deep: true
    }
  },
  methods: {
    updateCanvasDimensions() {
      const canvas = this.$refs.crosshairCanvas;
      const parent = canvas ? canvas.parentElement : null;

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
      const canvas = this.$refs.crosshairCanvas;
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

      if (this.extraCfgLines && this.extraCfgLines.length > 0) {
        cfg += `\n// Additional configs from uploaded file\n`;
        this.extraCfgLines.forEach(line => {
          cfg += `${line}\n`;
        });
      }

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
    copyToClipboard() {
        if (!this.output) return;
        navigator.clipboard.writeText(this.output).then(() => {
            this.copySuccess = true;
            setTimeout(() => {
                this.copySuccess = false;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    },
    saveSettings() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            const settings = {
                sensitivity: this.sensitivity,
                radarHUDScale: this.radarHUDScale,
                radarMapZoom: this.radarMapZoom,
                hudColor: this.hudColor,
                rgb: this.rgb,
                crosshair: this.crosshair,
                viewmodel: this.viewmodel,
                volumeMaster: this.volumeMaster,
                autoHelp: this.autoHelp,
                showHelp: this.showHelp,
                fpsMax: this.fpsMax,
                currentImageIndex: this.currentImageIndex,
                binds: this.binds,
                stickyEnabled: this.stickyEnabled
            };
            localStorage.setItem('cs2_autoexec_settings', JSON.stringify(settings));
        }, 500);
    },
    loadSettings() {
        const storedSettings = localStorage.getItem('cs2_autoexec_settings');
        if (storedSettings) {
            try {
                const settings = JSON.parse(storedSettings);
                // Merge loaded settings with defaults to ensure new fields are present
                if (settings.sensitivity !== undefined) this.sensitivity = settings.sensitivity;
                if (settings.radarHUDScale !== undefined) this.radarHUDScale = settings.radarHUDScale;
                if (settings.radarMapZoom !== undefined) this.radarMapZoom = settings.radarMapZoom;
                if (settings.hudColor !== undefined) this.hudColor = settings.hudColor;
                if (settings.rgb) this.rgb = { ...this.rgb, ...settings.rgb };
                if (settings.crosshair) this.crosshair = { ...this.crosshair, ...settings.crosshair };
                if (settings.viewmodel) this.viewmodel = { ...this.viewmodel, ...settings.viewmodel };
                if (settings.volumeMaster !== undefined) this.volumeMaster = settings.volumeMaster;
                if (settings.autoHelp !== undefined) this.autoHelp = settings.autoHelp;
                if (settings.showHelp !== undefined) this.showHelp = settings.showHelp;
                if (settings.fpsMax !== undefined) this.fpsMax = settings.fpsMax;
                if (settings.currentImageIndex !== undefined) this.currentImageIndex = settings.currentImageIndex;
                if (settings.binds) this.binds = { ...this.binds, ...settings.binds };
                if (settings.stickyEnabled !== undefined) this.stickyEnabled = settings.stickyEnabled;
            } catch (e) {
                console.warn('Failed to load settings from localStorage', e);
            }
        }
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
        
        this.saveSettings(); // Save defaults
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
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > 1048576) {
        alert("The file is too large. Maximum size 1MB.");
        return;
      }

      if (!file.name.toLowerCase().endsWith('.cfg')) {
        alert("Only .cfg files are allowed.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        this.parseCfg(content);
      };
      reader.readAsText(file);
    },
    parseCfg(content) {
      function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      const lines = content.split('\n');
      const matchedLines = new Set();

      const setVal = (regex, setter) => {
        const line = lines.find(line => regex.test(line));
        if (line) {
          const match = line.match(regex);
          if (match) {
            setter(match[1]);
            matchedLines.add(line.trim());
          }
        }
      };

      // Crosshair
      setVal(/cl_crosshairstyle\s+"?(\d+)"?/, val => this.crosshair.style = parseInt(val));
      setVal(/cl_crosshairsize\s+"?([\d.]+)"?/, val => this.crosshair.size = parseFloat(val));
      setVal(/cl_crosshairthickness\s+"?([\d.]+)"?/, val => this.crosshair.thickness = parseFloat(val));
      setVal(/cl_crosshairgap\s+"?([\d.-]+)"?/, val => this.crosshair.gap = parseFloat(val));
      setVal(/cl_crosshairalpha\s+"?(\d+)"?/, val => this.crosshair.alpha = parseInt(val));
      setVal(/cl_crosshair_drawoutline\s+"?(\d)"?/, val => this.crosshair.outline = val === '1');
      setVal(/cl_crosshairdot\s+"?(\d)"?/, val => this.crosshair.dot = val === '1');
      setVal(/cl_crosshair_recoil\s+"?(\d)"?/, val => this.crosshair.followRecoil = val === '1');
      setVal(/cl_crosshair_outlinethickness\s+"?([\d.]+)"?/, val => this.crosshair.outlineThickness = parseFloat(val));
      setVal(/cl_crosshair_t\s+"?(\d)"?/, val => this.crosshair.tstyle = val === '1');
      setVal(/cl_crosshaircolor_r\s+"?(\d+)"?/, val => this.rgb.r = parseInt(val));
      setVal(/cl_crosshaircolor_g\s+"?(\d+)"?/, val => this.rgb.g = parseInt(val));
      setVal(/cl_crosshaircolor_b\s+"?(\d+)"?/, val => this.rgb.b = parseInt(val));
      
      setVal(/cl_crosshairusealpha\s+"?(\d)"?/, val => this.crosshair.useAlpha = val === '1');

      // Sensitivity
      setVal(/sensitivity\s+"?([\d.]+)"?/, val => this.sensitivity = parseFloat(val));

      // HUD
      setVal(/cl_hud_color\s+"?(\d+)"?/, val => this.hudColor = parseInt(val));

      // Radar
      setVal(/cl_hud_radar_scale\s+"?([\d.]+)"?/, val => this.radarHUDScale = parseFloat(val));
      setVal(/cl_radar_scale\s+"?([\d.]+)"?/, val => this.radarMapZoom = parseFloat(val));

      // Viewmodel
      setVal(/viewmodel_fov\s+"?([\d.]+)"?/, val => this.viewmodel.fov = parseFloat(val));
      setVal(/viewmodel_offset_x\s+"?([\d.-]+)"?/, val => this.viewmodel.offsetX = parseFloat(val));
      setVal(/viewmodel_offset_y\s+"?([\d.-]+)"?/, val => this.viewmodel.offsetY = parseFloat(val));
      setVal(/viewmodel_offset_z\s+"?([\d.-]+)"?/, val => this.viewmodel.offsetZ = parseFloat(val));

      // Volume
      setVal(/volume\s+"?([\d.]+)"?/, val => this.volumeMaster = parseFloat(val));

      // Misc
      setVal(/cl_autohelp\s+"?(\d)"?/, val => this.autoHelp = val === '1');
      setVal(/cl_showhelp\s+"?(\d)"?/, val => this.showHelp = val === '1');
      setVal(/fps_max\s+"?(\d+)"?/, val => this.fpsMax = parseInt(val));

      // Binds (jump can be bound to multiple keys)
      const jumpBinds = [];
      lines.forEach(line => {
        const match = line.match(/bind\s+"?([^"]+)"?\s+"?(\+jump)"?/i);
        if (match) {
          jumpBinds.push(match[1]);
          matchedLines.add(line.trim());
        }
      });
      this.binds.jump = jumpBinds.length ? jumpBinds : [];

      const singleBinds = [
        { key: 'fire', command: '+attack' },
        { key: 'secondaryFire', command: '+attack2' },
        { key: 'toggleConsole', command: 'toggleconsole' },
        { key: 'mic', command: '+voicerecord' },
        { key: 'viewmodelToggle', command: 'toggleviewmodel' },
        { key: 'scoreboard', command: '+showscores' },
        { key: 'primaryWeapon', command: 'slot1' },
        { key: 'secondaryWeapon', command: 'slot2' },
        { key: 'meleeWeapon', command: 'slot3' },
        { key: 'cycleGrenades', command: 'slot4' },
        { key: 'explosives', command: 'slot5' },
        { key: 'heGrenade', command: 'use weapon_hegrenade' },
        { key: 'flashbang', command: 'use weapon_flashbang' },
        { key: 'smoke', command: 'use weapon_smokegrenade' },
        { key: 'molotov', command: 'use weapon_molotov; use weapon_incgrenade' },
      ];

      singleBinds.forEach(bind => {
        const escaped = escapeRegExp(bind.command);
        const regex = new RegExp(`bind\\s+"?([^"]+)"?\\s+"?${escaped}"?`, 'i');
        const line = lines.find(line => regex.test(line));
        if (line) {
          const match = line.match(regex);
          if (match) {
            this.binds[bind.key] = match[1];
            matchedLines.add(line.trim());
          }
        }
      });
      

      this.extraCfgLines = lines
        .map(line => line.trim())
        .filter(line => line && !matchedLines.has(line));

        this.generate();
    }
  },
}).mount("#app");
