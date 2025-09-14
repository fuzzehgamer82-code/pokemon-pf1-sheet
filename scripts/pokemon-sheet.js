// scripts/pokemon-sheet.js
// Pokémon PF1 Actor Sheet - safe class-definition inside init hook

(() => {
  // Defensive wrapper so errors are cleanly logged
  try {
    Hooks.once("init", () => {
      console.log("PokéSheet | init hook fired — registering sheet (PF1)");

      // Sanity check: ActorSheet must exist
      if (typeof ActorSheet === "undefined") {
        console.error("PokéSheet | ActorSheet is not defined. Foundry core not loaded?");
        return;
      }

      // Define the sheet class inside the hook to avoid "extends ActorSheet" before ActorSheet exists
      class PokemonActorSheet extends ActorSheet {
        static get defaultOptions() {
          return mergeObject(super.defaultOptions, {
            classes: ["pf1", "sheet", "pokemon-pokemon-sheet"],
            template: "modules/pokemon-pf1-sheet/templates/pokemon-sheet.html",
            width: 980,
            height: 760,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "summary" }]
          });
        }

        /** Prepare data for the template */
        getData(options) {
          const data = super.getData(options);
          const actor = this.actor;

          // Safe flag reads (module-scoped)
          const flags = actor.getFlag("pokemon-pf1-sheet", "data") || {};
          data.poke = {
            name: actor.name,
            level: (actor.system && actor.system.details && actor.system.details.level) ? actor.system.details.level : (actor.system && actor.system.level) ? actor.system.level : 1,
            nature: flags.nature || "Hardy",
            types: flags.types || [],
            moves: flags.moves || []
          };

          return data;
        }

        activateListeners(html) {
          super.activateListeners(html);
          // basic listeners so template doesn't error if you click
          html.find(".save-poke").on("click", ev => this._onSave(ev));
          html.find(".move-roll").on("click", ev => this._onMoveRoll(ev));
        }

        async _onSave(ev) {
          ev.preventDefault();
          // grab form data the Foundry way
          const form = this._getSubmitData();
          const flags = this.actor.getFlag("pokemon-pf1-sheet", "data") || {};
          // try to persist the poke data from the form if present
          if (form.poke) {
            flags.nature = form.poke.nature || flags.nature;
            flags.types = form.poke.types || flags.types;
            flags.moves = form.poke.moves || flags.moves;
            await this.actor.setFlag("pokemon-pf1-sheet", "data", flags);
            ui.notifications.info("Pokémon sheet saved.");
          } else {
            ui.notifications.warn("No Pokémon data found in form to save.");
          }
        }

        _onMoveRoll(ev) {
          ev.preventDefault();
          const btn = ev.currentTarget;
          const idx = Number($(btn).closest(".move").data("index"));
          const flags = this.actor.getFlag("pokemon-pf1-sheet", "data") || {};
          const move = (flags.moves && flags.moves[idx]) ? flags.moves[idx] : null;
          if (!move) return ui.notifications.warn("No move found to use.");
          // Minimal roll example (damage handled elsewhere in the full module)
          const atk = Math.floor(((this.actor.system?.abilities?.str?.value || 10) - 10) / 2);
          const roll = new Roll(`1d20 + ${atk}`);
          roll.roll().toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: `${move.name} attack roll` });
        }
      }

      // Register the sheet for PF1 actors (character and npc)
      try {
        Actors.registerSheet("pf1", PokemonActorSheet, {
          types: ["character", "npc"],
          makeDefault: false,
          label: "Pokémon (PF1)"
        });
        console.log("PokéSheet | Registered Pokémon (PF1) sheet.");
      } catch (err) {
        console.error("PokéSheet | Error registering sheet:", err);
      }
    });
  } catch (err) {
    console.error("PokéSheet | Unexpected error in module script:", err);
  }
})();


