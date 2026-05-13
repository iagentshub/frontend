// skills-load.js — importa skills desde ficheros JSON locales
'use strict';

function _parseAndLoadSkill(text) {
    var data = JSON.parse(text);
    if (!data.name) throw new Error('Missing required field: name');
    delete data.id;
    return {
        name: data.name || '',
        description: data.description || '',
        icon: data.icon || '',
        category: data.category || '',
        content: data.content || '',
    };
}
