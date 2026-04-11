window.CS2BindUtils = (() => {
  const bindDefinitions = [
    { key: "fire", command: "+attack", label: "Fire" },
    { key: "secondaryFire", command: "+attack2", label: "Secondary Fire" },
    { key: "toggleConsole", command: "toggleconsole", label: "Toggle Console" },
    { key: "mic", command: "+voicerecord", label: "Use Microphone" },
    { key: "viewmodelToggle", command: "toggleviewmodel", label: "Switch Viewmodel Hand" },
    { key: "scoreboard", command: "+showscores", label: "Scoreboard" },
    { key: "primaryWeapon", command: "slot1", label: "Primary Weapon" },
    { key: "secondaryWeapon", command: "slot2", label: "Secondary Weapon" },
    { key: "meleeWeapon", command: "slot3", label: "Melee Weapon" },
    { key: "cycleGrenades", command: "slot4", label: "Cycle Grenades" },
    { key: "explosives", command: "slot5", label: "Explosives & Traps" },
    { key: "heGrenade", command: "use weapon_hegrenade", label: "HE Grenade" },
    { key: "flashbang", command: "use weapon_flashbang", label: "Flashbang" },
    { key: "smoke", command: "use weapon_smokegrenade", label: "Smoke Grenade" },
    { key: "molotov", command: "use weapon_molotov; use weapon_incgrenade", label: "Molotov Cocktail" },
  ];

  const createDefaultBinds = () => ({
    jump: ["space", "", ""],
    fire: "mouse1",
    secondaryFire: "mouse2",
    toggleConsole: ".",
    mic: "q",
    viewmodelToggle: "l",
    scoreboard: "tab",
    primaryWeapon: "mouse5",
    secondaryWeapon: "mouse4",
    meleeWeapon: "1",
    cycleGrenades: "4",
    explosives: "3",
    heGrenade: "h",
    flashbang: "z",
    smoke: "x",
    molotov: "v",
  });

  const normalizeBindValue = (value) => {
    if (value === null || value === undefined) return "";
    return String(value).trim().toLowerCase();
  };

  const isValidBindValue = (value) => {
    if (!value) return false;
    if (value.length === 1) return true;
    return /^(mouse[1-5]|mwheel(up|down)|space|tab|enter|escape|backspace|delete|insert|home|end|pg(up|dn)|uparrow|downarrow|leftarrow|rightarrow|ctrl|shift|alt|capslock|win|menu|kp_[0-9]|f\d{1,2})$/.test(value);
  };

  const getBindCaptureResult = (event) => {
    if (event.type === "mousedown") {
      const mouseButtons = {
        0: "mouse1",
        1: "mouse3",
        2: "mouse2",
        3: "mouse4",
        4: "mouse5",
      };
      return { action: "set", value: mouseButtons[event.button] || "" };
    }

    if (event.type === "wheel") {
      return { action: "set", value: event.deltaY < 0 ? "mwheelup" : "mwheeldown" };
    }

    const key = event.key || "";
    const code = event.code || "";
    if (!key && !code) return { action: "ignore" };

    if (
      key === "Control" ||
      key === "Shift" ||
      key === "Alt" ||
      key === "Meta" ||
      code === "ControlLeft" ||
      code === "ControlRight" ||
      code === "ShiftLeft" ||
      code === "ShiftRight" ||
      code === "AltLeft" ||
      code === "AltRight" ||
      code === "MetaLeft" ||
      code === "MetaRight"
    ) {
      return { action: "ignore" };
    }

    if (key === "Escape" || code === "Escape") {
      return { action: "set", value: "escape" };
    }

    if (key === "Backspace" || key === "Delete" || key === "Del" || code === "Backspace" || code === "Delete") {
      const bindValue = key && key !== "Unidentified" ? key.toLowerCase() : code.toLowerCase();
      return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey
        ? { action: "set", value: bindValue }
        : { action: "clear" };
    }

    const keyMap = {
      " ": "space",
      Spacebar: "space",
      Tab: "tab",
      Enter: "enter",
      Insert: "insert",
      Home: "home",
      End: "end",
      PageUp: "pgup",
      PageDown: "pgdn",
      ArrowUp: "uparrow",
      ArrowDown: "downarrow",
      ArrowLeft: "leftarrow",
      ArrowRight: "rightarrow",
      Control: "ctrl",
      Shift: "shift",
      Alt: "alt",
      CapsLock: "capslock",
      Meta: "win",
      ContextMenu: "menu",
    };

    if (keyMap[key]) return { action: "set", value: keyMap[key] };
    if (/^F\d{1,2}$/.test(key)) return { action: "set", value: key.toLowerCase() };
    if (/^Numpad\d$/.test(key)) return { action: "set", value: `kp_${key.slice(-1)}` };
    if (key.length === 1) return { action: "set", value: key.toLowerCase() };

    return { action: "set", value: key.toLowerCase() };
  };

  const validateBinds = (binds) => {
    const normalizedBinds = createDefaultBinds();
    const errors = {};
    const issues = [];
    const seen = new Map();

    const register = (key, label, rawValue, assignValue) => {
      const value = normalizeBindValue(rawValue);
      if (!value) return;

      if (!isValidBindValue(value)) {
        errors[key] = `Invalid bind: ${rawValue}`;
        issues.push(`${label} has an invalid bind value.`);
        return;
      }

      if (seen.has(value)) {
        const firstLabel = seen.get(value);
        errors[key] = `Duplicate of ${firstLabel}`;
        issues.push(`${label} duplicates ${firstLabel}.`);
        return;
      }

      seen.set(value, label);
      assignValue(value);
    };

    const jumpValues = Array.isArray(binds.jump) ? binds.jump : [];

    jumpValues.forEach((rawValue, index) => {
      register(
        `jump:${index}`,
        `Jump Bind ${index + 1}`,
        rawValue,
        (value) => {
          normalizedBinds.jump[index] = value;
        }
      );
    });

    bindDefinitions.forEach((bind) => {
      register(bind.key, bind.label, binds[bind.key], (value) => {
        normalizedBinds[bind.key] = value;
      });
    });

    return { normalizedBinds, errors, issues };
  };

  return {
    bindDefinitions,
    createDefaultBinds,
    normalizeBindValue,
    getBindCaptureResult,
    validateBinds,
  };
})();
