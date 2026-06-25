// profile-teams.js — la seccion "Equipos" ahora muestra grupos de workspaces
// Redirige al usuario a la seccion Workspaces cuando hace clic en nav-teams
'use strict';

(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var navTeams = document.getElementById('nav-teams');
        var navWs    = document.getElementById('nav-workspaces');
        if (navTeams && navWs) {
            // Al hacer clic en "Equipos" redirigir a "Workspaces"
            navTeams.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                navWs.click();
            });
        }

        // Hide the teams section — it's superseded by workspaces+groups
        var teamsSection = document.getElementById('section-teams');
        if (teamsSection) teamsSection.style.display = 'none';

        // Check URL param for legacy ?tab=teams redirect
        var params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'teams' && navWs) {
            function _tryLoad() {
                if (window.i18n && window.i18n.ready) {
                    window.i18n.ready(function () { navWs.click(); });
                } else {
                    setTimeout(_tryLoad, 50);
                }
            }
            _tryLoad();
        }
    });
}());
