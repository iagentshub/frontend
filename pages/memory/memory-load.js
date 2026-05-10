// memory-load.js — importa ficheros de memoria desde local (.md o .json)
'use strict';

function _parseAndLoadMemory(filename, text) {
    if (filename.toLowerCase().endsWith('.json')) {
        var data = JSON.parse(text);
        return {
            filename: data.filename || filename.replace(/\.json$/i, ''),
            content: data.content || '',
        };
    }
    return {
        filename: filename.replace(/\.[^.]+$/, ''),
        content: text,
    };
}
