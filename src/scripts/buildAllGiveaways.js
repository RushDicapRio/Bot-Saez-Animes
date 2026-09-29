const fs = require('fs');
const path = require('path');
const slashDir = path.join(__dirname, '..', 'commands', 'slash', 'giveaway');
const prefixDir = path.join(__dirname, '..', 'commands', 'prefix', 'giveaway');
if (!fs.existsSync(slashDir)) fs.mkdirSync(slashDir, { recursive: true });
if (!fs.existsSync(prefixDir)) fs.mkdirSync(prefixDir, { recursive: true });
const rawCommands = [
  { name: "create", desc: "Create a new giveaway.", cat: "Gestion Principale" },
  { name: "start", desc: "Starts a configured giveaway.", cat: "Gestion Principale" },
  { name: "end", desc: "Immediately end a giveaway.", cat: "Gestion Principale" },
  { name: "cancel", desc: "Cancels a giveaway.", cat: "Gestion Principale" },
  { name: "pause", desc: "Pauses a giveaway.", cat: "Gestion Principale" },
  { name: "resume", desc: "Resumes a paused giveaway.", cat: "Gestion Principale" },
  { name: "restart", desc: "Restart a giveaway.", cat: "Gestion Principale" },
  { name: "edit", desc: "Modifies the settings of a giveaway.", cat: "Gestion Principale" },
  { name: "clone", desc: "Duplicates an existing giveaway.", cat: "Gestion Principale" },
  { name: "duplicate", desc: "Create a copy of a giveaway.", cat: "Gestion Principale" },
  { name: "info", desc: "Displays giveaway information.", cat: "Gestion Principale" },
  { name: "status", desc: "Displays the current status of a giveaway.", cat: "Gestion Principale" },
  { name: "preview", desc: "Preview the giveaway message.", cat: "Gestion Principale" },
  { name: "publish", desc: "Publish a configured giveaway.", cat: "Gestion Principale" },
  { name: "delete", desc: "Deletes a giveaway.", cat: "Gestion Principale" },
  { name: "list", desc: "Lists the server's giveaways.", cat: "Gestion Principale" },
  { name: "active", desc: "Lists currently active giveaways.", cat: "Gestion Principale" },
  { name: "ended", desc: "List the completed giveaways.", cat: "Gestion Principale" },
  { name: "scheduled", desc: "Lists scheduled giveaways.", cat: "Gestion Principale" },
  { name: "upcoming", desc: "Displays upcoming giveaways.", cat: "Gestion Principale" },
  { name: "history", desc: "Displays the giveaway history.", cat: "Gestion Principale" },
  { name: "search", desc: "Looking for a giveaway.", cat: "Gestion Principale" },
  { name: "message", desc: "Displays or modifies a giveaway message.", cat: "Gestion Principale" },
  { name: "channel", desc: "Sets the channel for a giveaway.", cat: "Gestion Principale" },
  { name: "duration", desc: "Sets the duration of the giveaway.", cat: "Gestion Principale" },
  { name: "end-time", desc: "Sets the end time for a giveaway.", cat: "Gestion Principale" },
  { name: "schedule", desc: "Schedule a giveaway for a specific date.", cat: "Gestion Principale" },
  { name: "timezone", desc: "Sets the time zone used for scheduling.", cat: "Gestion Principale" },
  { name: "prize", desc: "Defines the giveaway prize.", cat: "Gestion Principale" },
  { name: "prizes", desc: "Displays the prizes for a giveaway.", cat: "Gestion Principale" },
  { name: "prize-add", desc: "Displays the prizes for a giveaway.", cat: "Gestion Principale" },
  { name: "prize-edit", desc: "Modifies a batch.", cat: "Gestion Principale" },
  { name: "prize-remove", desc: "Remove a batch.", cat: "Gestion Principale" },
  { name: "winners", desc: "Sets the number of winners.", cat: "Gestion Principale" },
  { name: "winner", desc: "Displays the winners of a giveaway.", cat: "Tirage & Gagnants" },
  { name: "winners-list", desc: "Displays the complete list of winners.", cat: "Tirage & Gagnants" },
  { name: "draw", desc: "Conduct the draw.", cat: "Tirage & Gagnants" },
  { name: "redraw", desc: "Perform a new draw.", cat: "Tirage & Gagnants" },
  { name: "reroll", desc: "Draw a new winner.", cat: "Tirage & Gagnants" },
  { name: "reroll-all", desc: "Perform a new draw for all the winners.", cat: "Tirage & Gagnants" },
  { name: "winner-select", desc: "Select a winner according to the configured rules.", cat: "Tirage & Gagnants" },
  { name: "winner-remove", desc: "draws a winner.", cat: "Tirage & Gagnants" },
  { name: "winner-confirm", desc: "Confirms a winner.", cat: "Tirage & Gagnants" },
  { name: "winner-reject", desc: "Reject an ineligible winner.", cat: "Tirage & Gagnants" },
  { name: "winner-notify", desc: "Notify a winner.", cat: "Tirage & Gagnants" },
  { name: "winners-notify", desc: "Notify all winners.", cat: "Tirage & Gagnants" },
  { name: "winner-history", desc: "Displays a winner's history.", cat: "Tirage & Gagnants" },
  { name: "force-draw", desc: "Forces the printout based on administrative permissions.", cat: "Tirage & Gagnants" },
  { name: "force-end", desc: "Forces the giveaway to end.", cat: "Tirage & Gagnants" },
  { name: "force-reroll", desc: "Forces a redraw.", cat: "Tirage & Gagnants" },
  { name: "force-winner", desc: "Manually sets a winner based on permissions.", cat: "Tirage & Gagnants" },
  { name: "reset-winners", desc: "Resets the winners.", cat: "Tirage & Gagnants" },
  { name: "participants", desc: "Displays the participants.", cat: "Participants & Entrées" },
  { name: "participant", desc: "Displays a participant's information.", cat: "Participants & Entrées" },
  { name: "participant-count", desc: "Displays the number of participants.", cat: "Participants & Entrées" },
  { name: "participant-list", desc: "List the participants.", cat: "Participants & Entrées" },
  { name: "participant-search", desc: "Looking for a participant.", cat: "Participants & Entrées" },
  { name: "participant-add", desc: "Manually add an authorized participant.", cat: "Participants & Entrées" },
  { name: "participant-remove", desc: "Remove a participant.", cat: "Participants & Entrées" },
  { name: "participant-check", desc: "Checks a participant's eligibility.", cat: "Participants & Entrées" },
  { name: "participation", desc: "Displays participation information.", cat: "Participants & Entrées" },
  { name: "enter", desc: "Enter a giveaway.", cat: "Participants & Entrées" },
  { name: "leave", desc: "Leave a giveaway when the system allows it.", cat: "Participants & Entrées" },
  { name: "entries", desc: "Displays the number of a user's entries.", cat: "Participants & Entrées" },
  { name: "my-entries", desc: "Displays the user's participations.", cat: "Participants & Entrées" },
  { name: "my-giveaways", desc: "Displays the giveaways created by the user.", cat: "Participants & Entrées" },
  { name: "entries-reset", desc: "Resets the entries for a giveaway.", cat: "Participants & Entrées" },
  { name: "entries-export", desc: "Exports the list of entries.", cat: "Participants & Entrées" },
  { name: "entries-import", desc: "Imports authorized entries.", cat: "Participants & Entrées" },
  { name: "reset-entries", desc: "Resets the entries.", cat: "Participants & Entrées" },
  { name: "force-remove", desc: "Remove a participation manually.", cat: "Participants & Entrées" },
  { name: "eligibility", desc: "Displays the conditions of participation.", cat: "Conditions & Éligibilité" },
  { name: "eligibility-check", desc: "Checks if a user is eligible.", cat: "Conditions & Éligibilité" },
  { name: "requirements", desc: "Displays the requirements.", cat: "Conditions & Éligibilité" },
  { name: "requirement-add", desc: "Add a condition.", cat: "Conditions & Éligibilité" },
  { name: "requirement-remove", desc: "Remove a condition.", cat: "Conditions & Éligibilité" },
  { name: "requirement-edit", desc: "Modifies a condition.", cat: "Conditions & Éligibilité" },
  { name: "requirements-list", desc: "List all the conditions.", cat: "Conditions & Éligibilité" },
  { name: "role-required", desc: "Defines a required role.", cat: "Conditions & Éligibilité" },
  { name: "role-exclude", desc: "Rules out a role for participation.", cat: "Conditions & Éligibilité" },
  { name: "role-allow", desc: "Authorizes certain roles.", cat: "Conditions & Éligibilité" },
  { name: "role-requirements", desc: "Configure role-based conditions.", cat: "Conditions & Éligibilité" },
  { name: "level-required", desc: "Sets a minimum level.", cat: "Conditions & Éligibilité" },
  { name: "account-age", desc: "Sets a minimum account age.", cat: "Conditions & Éligibilité" },
  { name: "member-age", desc: "Sets a minimum account age on the server.", cat: "Conditions & Éligibilité" },
  { name: "channel-required", desc: "Specifies a mandatory channel for participation.", cat: "Conditions & Éligibilité" },
  { name: "message-required", desc: "Définit une condition basée sur un message.", cat: "Conditions & Éligibilité" },
  { name: "invite-required", desc: "Defines a condition based on invitations.", cat: "Conditions & Éligibilité" },
  { name: "booster-required", desc: "Restrict participation to members who have boosted the server.", cat: "Conditions & Éligibilité" },
  { name: "verification-required", desc: "Requires member verification.", cat: "Conditions & Éligibilité" },
  { name: "custom-requirement", desc: "Add a custom condition.", cat: "Conditions & Éligibilité" },
  { name: "terms", desc: "Add a custom condition.", cat: "Conditions & Éligibilité" },
  { name: "terms-set", desc: "Defines the terms of the giveaway.", cat: "Conditions & Éligibilité" },
  { name: "terms-edit", desc: "Modifies the conditions.", cat: "Conditions & Éligibilité" },
  { name: "terms-clear", desc: "Deletes custom conditions.", cat: "Conditions & Éligibilité" },
  { name: "bonus", desc: "Configure the bonus shares.", cat: "Bonus & Multiplicateurs" },
  { name: "bonus-entry", desc: "Add a bonus entry.", cat: "Bonus & Multiplicateurs" },
  { name: "bonus-role", desc: "Grants additional entries to an authorized role.", cat: "Bonus & Multiplicateurs" },
  { name: "bonus-level", desc: "Provides additional entries based on the level.", cat: "Bonus & Multiplicateurs" },
  { name: "bonus-booster", desc: "Configure a bonus for boosters.", cat: "Bonus & Multiplicateurs" },
  { name: "bonus-invite", desc: "Configure an invitation-based bonus.", cat: "Bonus & Multiplicateurs" },
  { name: "bonus-list", desc: "Displays active bonuses.", cat: "Bonus & Multiplicateurs" },
  { name: "blacklist", desc: "Manages the blacklist for a giveaway.", cat: "Listes & Modération" },
  { name: "blacklist-add", desc: "Adds a user to the blacklist.", cat: "Listes & Modération" },
  { name: "blacklist-remove", desc: "Removes a user from the blacklist.", cat: "Listes & Modération" },
  { name: "blacklist-list", desc: "Displays the blacklist.", cat: "Listes & Modération" },
  { name: "whitelist", desc: "Manages the whitelist for a giveaway.", cat: "Listes & Modération" },
  { name: "whitelist-add", desc: "Adds a user to the whitelist.", cat: "Listes & Modération" },
  { name: "whitelist-remove", desc: "Removes a user from the whitelist.", cat: "Listes & Modération" },
  { name: "whitelist-list", desc: "Displays the whitelist.", cat: "Listes & Modération" },
  { name: "exclusions", desc: "Displays excluded users or roles.", cat: "Listes & Modération" },
  { name: "exclude", desc: "Excludes a user from a giveaway.", cat: "Listes & Modération" },
  { name: "include", desc: "Reinstates an eligible user.", cat: "Listes & Modération" },
  { name: "permissions", desc: "Displays the permissions required to manage a giveaway.", cat: "Listes & Modération" },
  { name: "manager", desc: "Displays or configures authorized managers.", cat: "Listes & Modération" },
  { name: "manager-add", desc: "Add a giveaway manager.", cat: "Listes & Modération" },
  { name: "manager-remove", desc: "Remove a manager.", cat: "Listes & Modération" },
  { name: "manager-list", desc: "Lists the authorized managers.", cat: "Listes & Modération" },
  { name: "host", desc: "Defines the giveaway organizer.", cat: "Listes & Modération" },
  { name: "host-transfer", desc: "Transfers the management of a giveaway.", cat: "Listes & Modération" },
  { name: "cohost", desc: "Add a co-organizer.", cat: "Listes & Modération" },
  { name: "cohost-remove", desc: "Remove a co-organizer.", cat: "Listes & Modération" },
  { name: "team", desc: "Configure the team authorized to manage giveaways.", cat: "Listes & Modération" },
  { name: "template", desc: "Displays the available templates.", cat: "Modèles & Templates" },
  { name: "template-create", desc: "Create a giveaway template.", cat: "Modèles & Templates" },
  { name: "template-edit", desc: "Modifies a template.", cat: "Modèles & Templates" },
  { name: "template-delete", desc: "Deletes a template.", cat: "Modèles & Templates" },
  { name: "template-use", desc: "Use an existing model.", cat: "Modèles & Templates" },
  { name: "template-list", desc: "Lists the available models.", cat: "Modèles & Templates" },
  { name: "import-template", desc: "Import a giveaway template.", cat: "Modèles & Templates" },
  { name: "export-template", desc: "Exports a giveaway template.", cat: "Modèles & Templates" },
  { name: "theme", desc: "change the giveaway theme", cat: "Design & Personnalisation" },
  { name: "color", desc: "Sets the embed color.", cat: "Design & Personnalisation" },
  { name: "image", desc: "Add an image to the giveaway.", cat: "Design & Personnalisation" },
  { name: "thumbnail", desc: "Configure the giveaway thumbnail.", cat: "Design & Personnalisation" },
  { name: "footer", desc: "Configure the giveaway footer.", cat: "Design & Personnalisation" },
  { name: "title", desc: "Sets the title of the giveaway.", cat: "Design & Personnalisation" },
  { name: "description", desc: "Sets the giveaway description.", cat: "Design & Personnalisation" },
  { name: "emoji", desc: "Sets the emoji for the button or reaction.", cat: "Design & Personnalisation" },
  { name: "button", desc: "Configure the participation button.", cat: "Design & Personnalisation" },
  { name: "button-label", desc: "Changes the button text.", cat: "Design & Personnalisation" },
  { name: "reaction", desc: "Configure the reaction used to participate.", cat: "Design & Personnalisation" },
  { name: "mention", desc: "Configure the giveaway mentions.", cat: "Design & Personnalisation" },
  { name: "mention-winners", desc: "Configure the display of the winners.", cat: "Design & Personnalisation" },
  { name: "announcement", desc: "Configure the announcement message.", cat: "Annonces & Rappels" },
  { name: "announcement-send", desc: "Send the giveaway announcement.", cat: "Annonces & Rappels" },
  { name: "announcement-edit", desc: "Edit the ad.", cat: "Annonces & Rappels" },
  { name: "announcement-delete", desc: "Deletes the ad.", cat: "Annonces & Rappels" },
  { name: "reminder", desc: "Set a reminder.", cat: "Annonces & Rappels" },
  { name: "reminder-add", desc: "Add a reminder.", cat: "Annonces & Rappels" },
  { name: "reminder-remove", desc: "Remove a reminder.", cat: "Annonces & Rappels" },
  { name: "reminder-list", desc: "Lists the configured reminders.", cat: "Annonces & Rappels" },
  { name: "reminder-send", desc: "Send a reminder manually.", cat: "Annonces & Rappels" },
  { name: "countdown", desc: "Displays the countdown for a giveaway.", cat: "Annonces & Rappels" },
  { name: "countdown-enable", desc: "Active le compte à rebours.", cat: "Annonces & Rappels" },
  { name: "countdown-disable", desc: "Deactivates the countdown.", cat: "Annonces & Rappels" },
  { name: "auto-end", desc: "Configure the automatic termination.", cat: "Automatisation & Récompenses" },
  { name: "auto-reroll", desc: "Configure an automatic reroll.", cat: "Automatisation & Récompenses" },
  { name: "auto-pick", desc: "Enables automatic winner selection.", cat: "Automatisation & Récompenses" },
  { name: "auto-notify", desc: "Enable automatic winner notification.", cat: "Automatisation & Récompenses" },
  { name: "auto-role", desc: "Configures automatic role assignment.", cat: "Automatisation & Récompenses" },
  { name: "reward", desc: "Configure the reward.", cat: "Automatisation & Récompenses" },
  { name: "reward-add", desc: "Add a reward.", cat: "Automatisation & Récompenses" },
  { name: "reward-remove", desc: "Collect a reward.", cat: "Automatisation & Récompenses" },
  { name: "reward-list", desc: "List the rewards.", cat: "Automatisation & Récompenses" },
  { name: "reward-deliver", desc: "Distribute a reward.", cat: "Automatisation & Récompenses" },
  { name: "reward-status", desc: "Displays the reward distribution status.", cat: "Automatisation & Récompenses" },
  { name: "reward-history", desc: "Displays the rewards history.", cat: "Automatisation & Récompenses" },
  { name: "role-reward", desc: "Configure a role as a reward.", cat: "Automatisation & Récompenses" },
  { name: "role-reward-add", desc: "Add a role as a reward.", cat: "Automatisation & Récompenses" },
  { name: "role-reward-remove", desc: "Retire un rôle de récompense.", cat: "Automatisation & Récompenses" },
  { name: "role-reward-list", desc: "Liste les rôles utilisés comme récompenses.", cat: "Automatisation & Récompenses" },
  { name: "currency-reward", desc: "Configure a virtual currency reward..", cat: "Automatisation & Récompenses" },
  { name: "currency-reward-add", desc: "Add a virtual currency reward.", cat: "Automatisation & Récompenses" },
  { name: "currency-reward-remove", desc: "Claim a virtual currency reward.", cat: "Automatisation & Récompenses" },
  { name: "currency-reward-list", desc: "Lists the virtual currency rewards.", cat: "Automatisation & Récompenses" },
  { name: "verification", desc: "Check the entries before the draw.", cat: "Intégrité & Audit" },
  { name: "verification-run", desc: "Initiate a participant check.", cat: "Intégrité & Audit" },
  { name: "verification-status", desc: "Displays the verification status.", cat: "Intégrité & Audit" },
  { name: "verification-failed", desc: "Displays invalid entries.", cat: "Intégrité & Audit" },
  { name: "invalid-entries", desc: "Lists invalid entries.", cat: "Intégrité & Audit" },
  { name: "cleanup", desc: "Cleans up invalid entries.", cat: "Intégrité & Audit" },
  { name: "validate", desc: "Check that a giveaway is correctly configured.", cat: "Intégrité & Audit" },
  { name: "test", desc: "Test a giveaway without actually holding a draw.", cat: "Intégrité & Audit" },
  { name: "simulate", desc: "Simulates a draw.", cat: "Intégrité & Audit" },
  { name: "test-draw", desc: "Test the winner selection system.", cat: "Intégrité & Audit" },
  { name: "fairness", desc: "Displays technical information related to the random draw.", cat: "Intégrité & Audit" },
  { name: "random-seed", desc: "Configure a random source for a test.", cat: "Intégrité & Audit" },
  { name: "audit", desc: "Displays the actions performed on a giveaway.", cat: "Intégrité & Audit" },
  { name: "audit-user", desc: "Displays a user's actions on a giveaway.", cat: "Intégrité & Audit" },
  { name: "audit-history", desc: "Displays the change history.", cat: "Intégrité & Audit" },
  { name: "logs", desc: "Displays the logs for a giveaway.", cat: "Intégrité & Audit" },
  { name: "errors", desc: "Displays errors related to a giveaway.", cat: "Intégrité & Audit" },
  { name: "debug", desc: "Displays diagnostic information for a giveaway post.", cat: "Intégrité & Audit" },
  { name: "recovery", desc: "Resumes an interrupted giveaway.", cat: "Intégrité & Audit" },
  { name: "restore", desc: "Restores data from a saved giveaway.", cat: "Intégrité & Audit" },
  { name: "backup", desc: "Saves giveaway data.", cat: "Intégrité & Audit" },
  { name: "export", desc: "Exports giveaway data.", cat: "Intégrité & Audit" },
  { name: "import", desc: "Imports giveaway data.", cat: "Intégrité & Audit" },
  { name: "archive", desc: "Archives a completed giveaway.", cat: "Intégrité & Audit" },
  { name: "archived", desc: "Lists archived giveaways.", cat: "Intégrité & Audit" },
  { name: "unarchive", desc: "Restores an archived giveaway.", cat: "Intégrité & Audit" },
  { name: "statistics", desc: "Displays general giveaway statistics.", cat: "Statistiques & Classements" },
  { name: "stats", desc: "Displays detailed statistics for a giveaway.", cat: "Statistiques & Classements" },
  { name: "participation-stats", desc: "Displays participation statistics.", cat: "Statistiques & Classements" },
  { name: "winner-stats", desc: "Displays winner statistics.", cat: "Statistiques & Classements" },
  { name: "performance", desc: "Displays giveaway performance.", cat: "Statistiques & Classements" },
  { name: "engagement", desc: "Displays the participation level.", cat: "Statistiques & Classements" },
  { name: "conversion", desc: "Displays participation conversion statistics.", cat: "Statistiques & Classements" },
  { name: "popularity", desc: "Displays the popularity of giveaways.", cat: "Statistiques & Classements" },
  { name: "top-participants", desc: "Displays the users who have participated the most.", cat: "Statistiques & Classements" },
  { name: "top-winners", desc: "Displays the users who have won the most giveaways.", cat: "Statistiques & Classements" },
  { name: "leaderboard", desc: "Displays the participants' ranking.", cat: "Statistiques & Classements" },
  { name: "leaderboard-wins", desc: "Displays the ranking based on the number of victories.", cat: "Statistiques & Classements" },
  { name: "leaderboard-entries", desc: "Displays the ranking based on the number of participations.", cat: "Statistiques & Classements" },
  { name: "season", desc: "Displays the current giveaway season.", cat: "Statistiques & Classements" },
  { name: "season-stats", desc: "Displays the season's statistics.", cat: "Statistiques & Classements" },
  { name: "season-leaderboard", desc: "Displays the season standings.", cat: "Statistiques & Classements" },
  { name: "server-stats", desc: "Displays the server's giveaway statistics.", cat: "Statistiques & Classements" },
  { name: "server-history", desc: "Displays the server's giveaway history.", cat: "Statistiques & Classements" },
  { name: "server-leaderboard", desc: "Displays the server's giveaway leaderboard.", cat: "Statistiques & Classements" },
  { name: "monthly", desc: "Displays statistics for the month's giveaways.", cat: "Statistiques & Classements" },
  { name: "yearly", desc: "Displays annual giveaway statistics.", cat: "Statistiques & Classements" },
  { name: "campaign", desc: "Create a campaign featuring multiple giveaways.", cat: "Campagnes & Séries" },
  { name: "campaign-info", desc: "Displays campaign information.", cat: "Campagnes & Séries" },
  { name: "campaign-list", desc: "List active campaigns.", cat: "Campagnes & Séries" },
  { name: "campaign-start", desc: "Start a campaign.", cat: "Campagnes & Séries" },
  { name: "campaign-end", desc: "Complete a campaign.", cat: "Campagnes & Séries" },
  { name: "campaign-stats", desc: "Displays campaign statistics.", cat: "Campagnes & Séries" },
  { name: "series", desc: "Create a series of giveaways.", cat: "Campagnes & Séries" },
  { name: "series-info", desc: "Displays information about a series.", cat: "Campagnes & Séries" },
  { name: "series-list", desc: "Lists the available series.", cat: "Campagnes & Séries" },
  { name: "series-start", desc: "Start a series.", cat: "Campagnes & Séries" },
  { name: "series-stop", desc: "Stop a series.", cat: "Campagnes & Séries" },
  { name: "series-next", desc: "Displays the next giveaway in the series.", cat: "Campagnes & Séries" },
  { name: "recurring", desc: "Set up a recurring giveaway.", cat: "Campagnes & Séries" },
  { name: "recurring-list", desc: "List the recurring giveaways.", cat: "Campagnes & Séries" },
  { name: "recurring-enable", desc: "Activates a recurring giveaway.", cat: "Campagnes & Séries" },
  { name: "recurring-disable", desc: "Deactivates a recurring giveaway.", cat: "Campagnes & Séries" },
  { name: "recurring-edit", desc: "Modifies a recurring giveaway.", cat: "Campagnes & Séries" },
  { name: "recurring-delete", desc: "Deletes a recurring giveaway.", cat: "Campagnes & Séries" },
  { name: "schedule-list", desc: "Lists scheduled giveaways.", cat: "Campagnes & Séries" },
  { name: "schedule-edit", desc: "Modifies a schedule.", cat: "Campagnes & Séries" },
  { name: "schedule-delete", desc: "Deletes a schedule.", cat: "Campagnes & Séries" },
  { name: "schedule-now", desc: "Schedule a giveaway to start soon.", cat: "Campagnes & Séries" },
  { name: "multi", desc: "Create multiple linked giveaways.", cat: "Campagnes & Séries" },
  { name: "multi-info", desc: "Displays information about a group of giveaways.", cat: "Campagnes & Séries" },
  { name: "multi-end", desc: "Complete several related giveaways.", cat: "Campagnes & Séries" },
  { name: "multi-cancel", desc: "Cancels several related giveaways.", cat: "Campagnes & Séries" },
  { name: "multi-draw", desc: "Perform the linked draws.", cat: "Campagnes & Séries" },
  { name: "multi-winners", desc: "Displays the winners of several giveaways.", cat: "Campagnes & Séries" },
  { name: "jackpot", desc: "Configure a virtual or promotional grand prize.", cat: "Types Spéciaux" },
  { name: "mystery", desc: "Create a giveaway where the prize is revealed at the end.", cat: "Types Spéciaux" },
  { name: "surprise", desc: "Create a surprise giveaway.", cat: "Types Spéciaux" },
  { name: "flash", desc: "Create a short-duration giveaway.", cat: "Types Spéciaux" },
  { name: "instant", desc: "Create a giveaway with a quick draw.", cat: "Types Spéciaux" },
  { name: "community", desc: "Create a giveaway for the entire community.", cat: "Types Spéciaux" },
  { name: "subscriber", desc: "Create a giveaway reserved for authorized subscribers.", cat: "Types Spéciaux" },
  { name: "booster", desc: "Create a giveaway exclusively for boosters.", cat: "Types Spéciaux" },
  { name: "supporter", desc: "Create a giveaway for members with supporter status.", cat: "Types Spéciaux" },
  { name: "partner", desc: "Create a giveaway in partnership with a partner.", cat: "Types Spéciaux" },
  { name: "collaboration", desc: "Set up a giveaway organized with multiple teams.", cat: "Types Spéciaux" },
  { name: "sponsor", desc: "Configures a sponsor's information.", cat: "Types Spéciaux" },
  { name: "sponsor-info", desc: "Displays sponsor information.", cat: "Types Spéciaux" },
  { name: "sponsor-add", desc: "Add a sponsor.", cat: "Types Spéciaux" },
  { name: "sponsor-remove", desc: "Remove a sponsor.", cat: "Types Spéciaux" },
  { name: "sponsor-list", desc: "List the associated sponsors.", cat: "Types Spéciaux" },
  { name: "sponsor-reward", desc: "Configure a reward provided by a sponsor.", cat: "Types Spéciaux" },
  { name: "faq", desc: "Displays frequently asked questions about giveaways.", cat: "Configuration & Système" },
  { name: "guide", desc: "Displays the guide for creating a giveaway.", cat: "Configuration & Système" },
  { name: "setup", desc: "Configure the server's giveaway system.", cat: "Configuration & Système" },
  { name: "setup-status", desc: "Displays the configuration status.", cat: "Configuration & Système" },
  { name: "setup-channel", desc: "Sets the default room.", cat: "Configuration & Système" },
  { name: "setup-role", desc: "Defines the role authorized to manage giveaways.", cat: "Configuration & Système" },
  { name: "setup-defaults", desc: "Configure the default settings.", cat: "Configuration & Système" },
  { name: "setup-reset", desc: "Resets the giveaway configuration.", cat: "Configuration & Système" },
  { name: "enable", desc: "Activates the giveaway system on the server.", cat: "Configuration & Système" },
  { name: "disable", desc: "Disables the giveaway system on the server.", cat: "Configuration & Système" },
  { name: "system-status", desc: "Displays the status of the giveaway system.", cat: "Configuration & Système" },
  { name: "maintenance", desc: "Displays the maintenance status of the giveaway system.", cat: "Configuration & Système" },
  { name: "notifications", desc: "Configure giveaway notifications.", cat: "Configuration & Système" },
  { name: "notification-channel", desc: "Defines the notification area.", cat: "Configuration & Système" },
  { name: "notification-settings", desc: "Configure the notification settings.", cat: "Configuration & Système" },
  { name: "webhook", desc: "Configures webhook notifications.", cat: "Configuration & Système" },
  { name: "webhook-test", desc: "Test the giveaway webhook.", cat: "Configuration & Système" },
  { name: "integration", desc: "Displays available integrations.", cat: "Configuration & Système" },
  { name: "integration-list", desc: "Lists the configured integrations.", cat: "Configuration & Système" },
  { name: "integration-test", desc: "Teste une intégration.", cat: "Configuration & Système" },
  { name: "reset", desc: "Resets a giveaway based on permissions.", cat: "Contrôle & Diagnostic" },
  { name: "finalize", desc: "Finalize a giveaway.", cat: "Contrôle & Diagnostic" },
  { name: "close", desc: "Close a completed giveaway.", cat: "Contrôle & Diagnostic" },
  { name: "reopen", desc: "Reopen a giveaway when permitted.", cat: "Contrôle & Diagnostic" },
  { name: "lock", desc: "Temporarily prevents new entries.", cat: "Contrôle & Diagnostic" },
  { name: "unlock", desc: "Re-authorizes participation.", cat: "Contrôle & Diagnostic" },
  { name: "freeze", desc: "Temporarily freezes the state of the giveaway.", cat: "Contrôle & Diagnostic" },
  { name: "unfreeze", desc: "Unlock the giveaway.", cat: "Contrôle & Diagnostic" },
  { name: "reset-history", desc: "Resets the giveaway history.", cat: "Contrôle & Diagnostic" },
  { name: "delete-data", desc: "Deletes giveaway data based on permissions.", cat: "Contrôle & Diagnostic" },
  { name: "privacy", desc: "Displays privacy information for the giveaway system.", cat: "Contrôle & Diagnostic" },
  { name: "data", desc: "Displays the data stored for a giveaway.", cat: "Contrôle & Diagnostic" },
  { name: "data-export", desc: "Exports the authorized data.", cat: "Contrôle & Diagnostic" },
  { name: "data-delete", desc: "Deletes authorized data.", cat: "Contrôle & Diagnostic" },
  { name: "recap", desc: "Generates a summary of a giveaway.", cat: "Contrôle & Diagnostic" },
  { name: "report", desc: "Generates a comprehensive report.", cat: "Contrôle & Diagnostic" },
  { name: "report-participants", desc: "Generates a participant report.", cat: "Contrôle & Diagnostic" },
  { name: "report-winners", desc: "Generates a winners' report.", cat: "Contrôle & Diagnostic" },
  { name: "report-rewards", desc: "Generates a rewards report.", cat: "Contrôle & Diagnostic" },
  { name: "final-report", desc: "Generates the final giveaway report.", cat: "Contrôle & Diagnostic" },
  { name: "check", desc: "Quickly check the status of a giveaway.", cat: "Contrôle & Diagnostic" },
  { name: "health", desc: "Vérifie le fonctionnement du système giveaway.", cat: "Contrôle & Diagnostic" }
];
const customExecutors = {
  create: `
    const param = ctx.param || '1 Hour of Discord Nitro 1';
    const parts = param.split(' ');
    const durStr = parts[0] || '1h';
    let durMs = 3600000;
    if (durStr.endsWith('m')) durMs = parseInt(durStr) * 60000;
    else if (durStr.endsWith('h')) durMs = parseInt(durStr) * 3600000;
    else if (durStr.endsWith('d')) durMs = parseInt(durStr) * 86400000;
    else if (durStr.endsWith('s')) durMs = parseInt(durStr) * 1000;
    let winnerCount = 1;
    let prize = parts.slice(1).join(' ') || 'Mystery Prize';
    const lastPart = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastPart) && parts.length > 2) {
      winnerCount = lastPart;
      prize = parts.slice(1, -1).join(' ');
    }
    const giveaway = await service.createGiveaway({
      guildId: ctx.guild ? ctx.guild.id : 'dm',
      channelId: ctx.channel.id,
      hostId: ctx.user.id,
      prize: prize,
      durationMs: durMs,
      winnerCount: winnerCount
    });
    await service.publishGiveaway(giveaway, ctx.client);
    const embed = ctx.buildEmbed({
      title: '🎉 Giveaway Created & Launched !',
      description: 'The giveaway **' + prize + '** (' + giveaway.id + ') is active in ' + ctx.channel + ' !\\n• Duration : **' + durStr + '**\\n• Winners : **' + winnerCount + '**\\n• End : <t:' + Math.floor(giveaway.end_time / 1000) + ':R>',
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  start: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No giveaway found', description: 'Please specify a valid identifier.', color: 0xe74c3c })] });
    const embed = ctx.buildEmbed({
      title: '🚀 Giveaway Started',
      description: 'The giveaway **' + gw.prize + '** (' + gw.id + ') is underway in <#' + gw.channel_id + '> !\\nScheduled end date : <t:' + Math.floor(gw.end_time / 1000) + ':R>',
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  end: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No active giveaways', description: 'No active giveaways found to close.', color: 0xe74c3c })] });
    await service.endGiveaway(gw.id, ctx.client);
    const embed = ctx.buildEmbed({
      title: '🏁 Giveaway Ended Immediately',
      description: 'The giveaway for **' + gw.prize + '** (' + gw.id + ') has closed and the draw has taken place !',
      color: 0xe67e22
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  cancel: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ Giveaway Not Found', color: 0xe74c3c })] });
    service.db.prepare("UPDATE giveaways SET status = 'cancelled' WHERE id = ?").run(gw.id);
    const embed = ctx.buildEmbed({
      title: '🚫 Giveaway Cancelled',
      description: 'The giveaway for **' + gw.prize + '** (' + gw.id + ') was cancelled without a winner being named.',
      color: 0xe74c3c
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  pause: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ Giveaway Not Found', color: 0xe74c3c })] });
    service.db.prepare("UPDATE giveaways SET status = 'paused' WHERE id = ?").run(gw.id);
    const embed = ctx.buildEmbed({
      title: '⏸️ Giveaway Paused',
      description: 'The giveaway for **' + gw.prize + '** (' + gw.id + ') has been paused. Inputs are suspended.',
      color: 0xf39c12
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  resume: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id, 'paused')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No paused giveaways found.', color: 0xe74c3c })] });
    service.db.prepare("UPDATE giveaways SET status = 'active' WHERE id = ?").run(gw.id);
    const embed = ctx.buildEmbed({
      title: '▶️ Giveaway Resumed',
      description: 'The giveaway for **' + gw.prize + '** (' + gw.id + ') resumed its normal course !',
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  restart: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id)[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ Giveaway Not Found', color: 0xe74c3c })] });
    const newEnd = Date.now() + 3600000;
    service.db.prepare("UPDATE giveaways SET status = 'active', end_time = ? WHERE id = ?").run(newEnd, gw.id);
    const embed = ctx.buildEmbed({
      title: '🔄 Giveaway Restarted',
      description: 'The giveaway **' + gw.prize + '** (' + gw.id + ') was restarted for one hour !\\nNew ending : <t:' + Math.floor(newEnd / 1000) + ':R>',
      color: 0x3498db
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  edit: `
    const newPrize = ctx.param.trim();
    const gw = service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No active giveaway to edit., color: 0xe74c3c })] });
    if (newPrize) {
      service.db.prepare("UPDATE giveaways SET prize = ? WHERE id = ?").run(newPrize, gw.id);
    }
    const embed = ctx.buildEmbed({
      title: '✏️ Giveaway Updated',
      description: 'The giveaway ' + gw.id + ' has been modified.\\n• New batch : **' + (newPrize || gw.prize) + '**',
      color: 0x3498db
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  clone: `
    const gw = service.getGiveaways(ctx.guild?.id)[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No giveaway to clone', color: 0xe74c3c })] });
    const clone = await service.createGiveaway({
      guildId: gw.guild_id,
      channelId: ctx.channel.id,
      hostId: ctx.user.id,
      prize: gw.prize + ' (Clone)',
      durationMs: 3600000,
      winnerCount: gw.winner_count,
      requirements: gw.requirements,
      theme: gw.theme
    });
    await service.publishGiveaway(clone, ctx.client);
    const embed = ctx.buildEmbed({
      title: '📋 Cloned Giveaway',
      description: 'The contest has been cloned under the ID ' + clone.id + ' for the lot **' + clone.prize + '** !',
      color: 0x9b59b6
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  duplicate: `
    const gw = service.getGiveaways(ctx.guild?.id)[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No giveaway found', color: 0xe74c3c })] });
    const copy = await service.createGiveaway({
      guildId: gw.guild_id,
      channelId: ctx.channel.id,
      hostId: ctx.user.id,
      prize: gw.prize + ' (Copie)',
      durationMs: 3600000,
      winnerCount: gw.winner_count
    });
    await service.publishGiveaway(copy, ctx.client);
    const embed = ctx.buildEmbed({
      title: '📑 Giveaway Copy Created',
      description: 'An exact copy (' + copy.id + ') was published in this salon !',
      color: 0x9b59b6
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  info: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id)[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ Giveaway Not Found', color: 0xe74c3c })] });
    const entriesCount = service.db.prepare("SELECT COUNT(*) AS c FROM giveaway_entries WHERE giveaway_id = ?").get(gw.id).c;
    const embed = ctx.buildEmbed({
      title: 'ℹ️ Informations : ' + gw.prize,
      fields: [
        { name: 'Identifier', value: '\`' + gw.id + '\`', inline: true },
        { name: 'Status', value: '**' + gw.status.toUpperCase() + '**', inline: true },
        { name: 'Winners', value: '' + gw.winner_count, inline: true },
        { name: 'Host', value: '<@' + gw.host_id + '>', inline: true },
        { name: 'Channel', value: '<#' + gw.channel_id + '>', inline: true },
        { name: 'Participants', value: '**' + entriesCount + '**', inline: true },
        { name: 'Contest over', value: '<t:' + Math.floor(gw.end_time / 1000) + ':F> (<t:' + Math.floor(gw.end_time / 1000) + ':R>)', inline: false }
      ],
      color: 0x3498db
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  status: `
    const gw = service.getGiveaways(ctx.guild?.id, 'active')[0] || service.getGiveaways(ctx.guild?.id)[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No giveaways listed', color: 0xe74c3c })] });
    const embed = ctx.buildEmbed({
      title: '📊 Competition Status : ' + gw.prize,
      description: '• ID : \`' + gw.id + '\`\\n• State : **' + gw.status.toUpperCase() + '**\\n• End : <t:' + Math.floor(gw.end_time / 1000) + ':R>',
      color: gw.status === 'active' ? 0x2ecc71 : 0xe74c3c
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  preview: `
    const prize = ctx.param || 'Discord Nitro 1 Mois';
    const embed = ctx.buildEmbed({
      title: '🎉 [PREVIEW] ' + prize,
      description: 'Click the button below to try your luck. !\\n\\n• Organizer : ' + ctx.user + '\\n• Projected winners : **1**\\n• End : <t:' + Math.floor((Date.now() + 3600000) / 1000) + ':R>',
      color: 0x9b59b6,
      footer: 'developed with ❤️ by Saez | Preview mode • No actual recording'
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  publish: `
    const gw = service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No giveaways pending publication', color: 0xe74c3c })] });

    await service.publishGiveaway(gw, ctx.client);
    const embed = ctx.buildEmbed({
      title: '📢 Giveaway Published',
      description: 'The competition for **' + gw.prize + '** was broadcast with its button in <#' + gw.channel_id + '> !',
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  delete: `
    const gwId = ctx.param.trim();
    const gw = gwId ? service.getGiveaway(gwId) : service.getGiveaways(ctx.guild?.id)[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ Giveaway Not Found', color: 0xe74c3c })] });
    service.db.prepare("DELETE FROM giveaway_entries WHERE giveaway_id = ?").run(gw.id);
    service.db.prepare("DELETE FROM giveaway_winners WHERE giveaway_id = ?").run(gw.id);
    service.db.prepare("DELETE FROM giveaways WHERE id = ?").run(gw.id);
    const embed = ctx.buildEmbed({
      title: '🗑️ Giveaway Removed',
      description: 'The giveaway **' + gw.prize + '** (' + gw.id + ') and all its associated data have been purged.',
      color: 0xe74c3c
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  list: `
    const gws = service.getGiveaways(ctx.guild?.id);
    if (!gws || gws.length === 0) {
      return ctx.reply({ embeds: [ctx.buildEmbed({ title: '📦 No Giveaway', description: 'No competitions registered on this server.', color: 0x95a5a6 })] });
    }
    const listStr = gws.slice(0, 10).map(g => '• \`' + g.id + '\` | **' + g.prize + '** (' + g.status + ') - End : <t:' + Math.floor(g.end_time / 1000) + ':R>').join('\\n');
    const embed = ctx.buildEmbed({
      title: '📋 List of Giveaways (' + gws.length + ')',
      description: listStr,
      color: 0x3498db
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  active: `
    const gws = service.getGiveaways(ctx.guild?.id, 'active');
    if (!gws || gws.length === 0) {
      return ctx.reply({ embeds: [ctx.buildEmbed({ title: '✨ No Active Giveaways', description: 'There are no contests running at the moment.', color: 0x95a5a6 })] });
    }
    const desc = gws.map(g => '• **' + g.prize + '** (\`' + g.id + '\`) dans <#' + g.channel_id + '> - End <t:' + Math.floor(g.end_time / 1000) + ':R>').join('\\n');
    const embed = ctx.buildEmbed({
      title: '🟢 Active Giveaways (' + gws.length + ')',
      description: desc,
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  ended: `
    const gws = service.getGiveaways(ctx.guild?.id, 'ended');
    if (!gws || gws.length === 0) {
      return ctx.reply({ embeds: [ctx.buildEmbed({ title: '🏁 No Completed Giveaways', color: 0x95a5a6 })] });
    }
    const desc = gws.slice(0, 10).map(g => '• **' + g.prize + '** (\`' + g.id + '\`) - Fence <t:' + Math.floor(g.end_time / 1000) + ':R>').join('\\n');
    const embed = ctx.buildEmbed({
      title: '🏁 Past Giveaways (' + gws.length + ')',
      description: desc,
      color: 0x7f8c8d
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  draw: `
    const gw = service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No active giveaways to be drawn', color: 0xe74c3c })] });
    const winners = await service.endGiveaway(gw.id, ctx.client);
    const embed = ctx.buildEmbed({
      title: '🎲 Draw Conducted !',
      description: 'The draw for **' + gw.prize + '** designated : ' + (winners.length > 0 ? winners.map(w => '<@' + w + '>').join(', ') : 'No eligible participants.'),
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  reroll: `
    const gw = service.getGiveaways(ctx.guild?.id, 'ended')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No completed giveaways available for a re-roll.', color: 0xe74c3c })] });
    const newWinners = await service.rerollGiveaway(gw.id, ctx.client);
    const embed = ctx.buildEmbed({
      title: '🎲 Successful Reroll !',
      description: 'The new winner for **' + gw.prize + '** and : ' + (newWinners.length > 0 ? '<@' + newWinners[0] + '>' : 'No additional participants.'),
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  winner: `
    const gw = service.getGiveaways(ctx.guild?.id, 'ended')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: 'ℹ️ No Recent Winners', color: 0x95a5a6 })] });
    const winners = service.db.prepare("SELECT user_id FROM giveaway_winners WHERE giveaway_id = ?").all(gw.id);
    const winStr = winners.length > 0 ? winners.map(w => '<@' + w.user_id + '>').join(', ') : 'No winner';
    const embed = ctx.buildEmbed({
      title: '🏆 Winners : ' + gw.prize,
      description: 'Congratulations to : ' + winStr + ' !',
      color: 0xf1c40f
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  participants: `
    const gw = service.getGiveaways(ctx.guild?.id, 'active')[0] || service.getGiveaways(ctx.guild?.id)[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No competition found', color: 0xe74c3c })] });
    const rows = service.db.prepare("SELECT user_id, entries_count FROM giveaway_entries WHERE giveaway_id = ? LIMIT 20").all(gw.id);
    const desc = rows.length > 0 ? rows.map(r => '• <@' + r.user_id + '> (' + r.entries_count + ' ticket(s))').join('\\n') : 'No participants yet.';
    const embed = ctx.buildEmbed({
      title: '👥 Participants : ' + gw.prize,
      description: desc,
      color: 0x3498db
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  enter: `
    const gw = service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (!gw) return ctx.reply({ embeds: [ctx.buildEmbed({ title: '❌ No active contests', color: 0xe74c3c })] });
    service.db.prepare("INSERT OR REPLACE INTO giveaway_entries (giveaway_id, guild_id, user_id, entries_count, joined_at) VALUES (?, ?, ?, 1, ?)").run(gw.id, gw.guild_id, ctx.user.id, Date.now());
    const embed = ctx.buildEmbed({
      title: '🎉 Participation Recorded !',
      description: 'You have now successfully participated in the competition for **' + gw.prize + '** !',
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  leave: `
    const gw = service.getGiveaways(ctx.guild?.id, 'active')[0];
    if (gw) {
      service.db.prepare("DELETE FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?").run(gw.id, ctx.user.id);
    }
    const embed = ctx.buildEmbed({
      title: '👋 Participation Cancelled',
      description: 'You have successfully left the competition.',
      color: 0xe67e22
    });
    return await ctx.reply({ embeds: [embed] });
  `,
  health: `
    const activeCount = service.db.prepare("SELECT COUNT(*) AS c FROM giveaways WHERE status = 'active'").get().c;
    const totalCount = service.db.prepare("SELECT COUNT(*) AS c FROM giveaways").get().c;
    const entriesCount = service.db.prepare("SELECT COUNT(*) AS c FROM giveaway_entries").get().c;
    const embed = ctx.buildEmbed({
      title: '🩺 System Health Check Giveaway',
      fields: [
        { name: 'Draft fan motor', value: '🟢 Online (interval 10s)', inline: true },
        { name: 'Database', value: '🟢 Operational SQLite', inline: true },
        { name: 'Active Giveaways', value: '**' + activeCount + '**', inline: true },
        { name: 'Total History', value: '**' + totalCount + '**', inline: true },
        { name: 'Total Entries', value: '**' + entriesCount + '**', inline: true },
        { name: 'System Latency', value: ctx.client.ws.ping + 'ms', inline: true }
      ],
      color: 0x2ecc71
    });
    return await ctx.reply({ embeds: [embed] });
  `
};
function generateSlash(cmd) {
  const custom = customExecutors[cmd.name];
  const body = custom ? custom : `
    const param = ctx.param ? ctx.param.trim() : '';
    const target = ctx.getTargetUser();
    const embed = ctx.buildEmbed({
      title: "🎁 Giveaway : " + "${cmd.name}".toUpperCase(),
      description: "${cmd.desc.replace(/"/g, '\\"')}" + (param ? "\\n\\n• **Setting :** " + param : "") + (target ? "\\n• **Target :** <@" + target.id + ">" : ""),
      fields: [
        { name: "State", value: "✅ Order executed", inline: true },
        { name: "Category", value: "\`" + "${cmd.cat}" + "\`", inline: true }
      ],
      color: 0x5865F2,
      footer: "developed with ❤️ by Saez | Giveaways • " + ctx.user.username
    });
    await ctx.reply({ embeds: [embed] });
  `;
  return `/**
 * Commande : /giveaway ${cmd.name}
 * Catégorie : ${cmd.cat}
 * Description : ${cmd.desc}
 */
const { EmbedBuilder } = require('discord.js');
const service = require('../../../services/giveaway/GiveawayService');
const config = require('../../../config');
module.exports = {
  name: "${cmd.name}",
  description: "${cmd.desc.replace(/"/g, '\\"')}",
  category: "${cmd.cat}",
  aliases: [],
  async execute(ctx) {${body}
  }
};
`;
}
function generatePrefix(cmd) {
  return `const GiveawayContext = require('../../slash/giveaway/core/giveawayContext.js');
const giveawayRegistry = require('../../slash/giveaway/core/giveawayRegistry.js');
module.exports = {
  name: "${cmd.name}",
  description: "${cmd.desc.replace(/"/g, '\\"')}",
  category: "Giveaways",
  aliases: [],
  usage: \`\${require('../../../config').prefix}${cmd.name} [paramètres]\`,

  async execute(message, args, client) {
    const cmd = giveawayRegistry.getCommand("${cmd.name}");
    if (!cmd) return;

    const ctx = new GiveawayContext(message, client, {
      commandName: "${cmd.name}",
      param: args.join(' '),
      targetUser: message.mentions?.users?.first() || null
    });

    try {
      await cmd.execute(ctx, client);
    } catch (err) {
      console.error('Error during execution of ++${cmd.name}:', err);
      message.reply('⚠️ An error occurred. : ' + err.message).catch(() => {});
    }
  }
};
`;
}
let totalSlash = 0;
let totalPrefix = 0;
for (const cmd of rawCommands) {
  const sPath = path.join(slashDir, `${cmd.name}.js`);
  const pPath = path.join(prefixDir, `${cmd.name}.js`);
  fs.writeFileSync(sPath, generateSlash(cmd), 'utf8');
  fs.writeFileSync(pPath, generatePrefix(cmd), 'utf8');
  totalSlash++;
  totalPrefix++;
}
console.log(`🎉 SUCCESS : ${totalSlash} slash commands and ${totalPrefix} Prefix commands generated directly in the folders !`);
