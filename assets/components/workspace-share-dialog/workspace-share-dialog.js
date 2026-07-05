// workspace-share-dialog.js — concede acceso de un recurso al workspace activo,
// sin mover ni duplicar el recurso. El destino es siempre el workspace en el que
// el usuario está trabajando ahora mismo (no hay selector).
'use strict';

var WorkspaceShareDialog = (function () {
    async function open(resourceType, resourceId, resourceName, onSuccess) {
        var name = resourceName || resourceId;
        var ok = window.confirm(
            '¿Compartir "' + name + '" con este workspace?\n\n' +
            'No se mueve ni se duplica: el resto del workspace podrá usarlo, pero sigue siendo tuyo. ' +
            'Si dejas de compartirlo, lo desactivas o abandonas el workspace, perderán el acceso al instante.'
        );
        if (!ok) return;
        try {
            await api.post('/api/sharing/' + resourceType + '/' + encodeURIComponent(resourceId), {});
            toast('Compartido con el workspace', 'success');
            if (onSuccess) onSuccess();
        } catch (e) {
            toast(e.message || 'No se pudo compartir', 'error');
        }
    }

    return { open: open };
})();

window.WorkspaceShareDialog = WorkspaceShareDialog;
