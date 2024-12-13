/** @type {string | number} */
export let defaultHearingRange;
export let defaultStealthCapability;

Hooks.once("init", () => {
    game.settings.register(
        "vision-5e",
        "defaultHearingRange",
        {
            name: "VISION5E.SETTINGS.defaultHearingRange.label",
            hint: "VISION5E.SETTINGS.defaultHearingRange.hint",
            scope: "world",
            config: true,
            requiresReload: true,
            type: new dnd5e.dataModels.fields.FormulaField({
                deterministic: true,
                initial: "15 + 2.5 * (@skills.prc.passive - 10)",
            }),
        },
    );

    game.settings.register(
        "vision-5e",
        "defaultStealthCapability",
        {
            name: "VISION5E.SETTINGS.defaultStealthCapability.label",
            hint: "VISION5E.SETTINGS.defaultStealthCapability.hint",
            scope: "world",
            config: true,
            requiresReload: true,
            type: new dnd5e.dataModels.fields.FormulaField({
                deterministic: true,
                initial: "15 + 2.5 * (@skills.slt.passive - 10)",
            }),
        },
    );

    Hooks.on("renderSettingsConfig", (app, html) => {
        if (!game.user.isGM) {
            return;
        }

        html[0].querySelector(`input[name="vision-5e.defaultHearingRange"]`).placeholder = "0";
        html[0].querySelector(`[data-setting-id="vision-5e.defaultHearingRange"] label`)
            .insertAdjacentHTML("beforeend", ` <span class="units">(ft)</span>`);
    });

    Hooks.on("renderSettingsConfig", (app, html) => {
        if (!game.user.isGM) {
            return;
        }

        html[0].querySelector(`input[name="vision-5e.defaultStealthCapability"]`).placeholder = "0";
        html[0].querySelector(`[data-setting-id="vision-5e.defaultStealthCapability"] label`)
            .insertAdjacentHTML("beforeend", ` <span class="units">(ft)</span>`);
    });

    const hearingFormula = game.settings.get("vision-5e", "defaultHearingRange");

    if (Roll.validate(hearingFormula)) {
        try {
            defaultHearingRange = Roll.safeEval(hearingFormula);
        } catch (_error) {
            defaultHearingRange = hearingFormula;
        }
    }

    const stealthFormula = game.settings.get("vision-5e", "defaultStealthCapability");

    if (Roll.validate(stealthFormula)) {
        try {
            defaultStealthCapability = Roll.safeEval(stealthFormula);
        } catch (_error) {
            defaultStealthCapability = stealthFormula;
        }
    }
});
