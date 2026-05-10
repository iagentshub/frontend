// test_loads.js — tests para las funciones de importación de ficheros locales
// Ejecutar con: node frontend/tests/test_loads.js
'use strict';

const assert = require('assert');
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log('  OK  ' + name);
        passed++;
    } catch (e) {
        console.error('FAIL  ' + name);
        console.error('      ' + e.message);
        failed++;
    }
}

// ─── Inline copies of production functions ────────────────────────────────────

function _parseFrontmatter(text) {
    if (!text.startsWith('---')) return { meta: {}, body: text.trim() };
    var end = text.indexOf('\n---', 3);
    if (end === -1) return { meta: {}, body: text.trim() };
    var meta = {};
    text.slice(4, end).split('\n').forEach(function (line) {
        var m = line.match(/^([\w-]+):\s*(.+)/);
        if (m) meta[m[1].trim()] = m[2].trim();
    });
    return { meta: meta, body: text.slice(end + 4).trim() };
}

function _parseGithubMdFree(text) {
    var lines = text.split('\n');
    var name = '';
    var copilotTopic = '';
    var bodyLines = [];
    lines.forEach(function (line) {
        if (!name && line.startsWith('# ')) {
            name = line.slice(2).trim();
        } else {
            var topicMatch = line.match(/^\*\*Topic:\*\*\s*(.+)/);
            if (topicMatch) {
                copilotTopic = topicMatch[1].trim();
            } else {
                bodyLines.push(line);
            }
        }
    });
    var body = bodyLines.join('\n').trim();
    var firstPara = body.split(/\n\n+/)[0] || '';
    var description = firstPara.length <= 200 && !firstPara.startsWith('#') ? firstPara : '';
    return { name: name || '', description: description, system_prompt: body, agent_type: 'github', copilot_topic: copilotTopic };
}

function _parseAndLoadAgent(filename, text) {
    var lower = filename.toLowerCase();
    if (lower.endsWith('.md')) {
        var parsed = _parseFrontmatter(text);
        if (Object.keys(parsed.meta).length > 0) {
            if (lower.endsWith('.agent.md')) {
                return { name: parsed.meta.name || filename.replace(/\.agent\.md$/i, ''), description: parsed.meta.description || '', system_prompt: parsed.body, agent_type: 'github', copilot_topic: parsed.meta.target || '' };
            }
            return { name: parsed.meta.name || '', description: parsed.meta.description || '', system_prompt: parsed.body, model: parsed.meta.model || '', agent_type: 'claude' };
        }
        return _parseGithubMdFree(text);
    }
    var data = JSON.parse(text);
    if (data.agent_type) { delete data.id; data.routines = data.routines || []; return data; }
    if (data.instructions !== undefined || data.tool_choice !== undefined || data.frequency_penalty !== undefined) {
        return { name: data.name || '', description: data.description || '', system_prompt: data.instructions || '', model: data.model || '', temperature: data.temperature, agent_type: 'openai', response_format: (data.response_format && data.response_format.type) || data.response_format || 'text', tool_choice: data.tool_choice || 'auto', frequency_penalty: data.frequency_penalty || 0, presence_penalty: data.presence_penalty || 0, routines: data.routines || [] };
    }
    if (data.extended_thinking !== undefined || data.cache_control !== undefined || data.anthropic_betas !== undefined) {
        return { name: data.name || '', description: data.description || '', system_prompt: data.system_prompt || '', model: data.model || '', temperature: data.temperature, agent_type: 'claude', extended_thinking: !!data.extended_thinking, thinking_budget_tokens: data.thinking_budget_tokens || 10000, cache_control: !!data.cache_control, routines: data.routines || [] };
    }
    return { name: data.name || '', description: data.description || '', system_prompt: data.system_prompt || data.instructions || '', model: data.model || '', temperature: data.temperature, agent_type: 'generic', routines: data.routines || [] };
}

function _parseAndLoadSkill(text) {
    var data = JSON.parse(text);
    if (!data.name) throw new Error('Missing required field: name');
    delete data.id;
    return { name: data.name || '', description: data.description || '', icon: data.icon || '', category: data.category || '', content: data.content || '' };
}

function _parseAndLoadMemory(filename, text) {
    if (filename.toLowerCase().endsWith('.json')) {
        var data = JSON.parse(text);
        return { filename: data.filename || filename.replace(/\.json$/i, ''), content: data.content || '' };
    }
    return { filename: filename.replace(/\.[^.]+$/, ''), content: text };
}

// ─── _parseFrontmatter ────────────────────────────────────────────────────────

console.log('\n_parseFrontmatter');

test('valid frontmatter extracts meta and body', function () {
    var r = _parseFrontmatter('---\nname: My Agent\nmodel: claude-3\n---\nThis is the body.');
    assert.strictEqual(r.meta.name, 'My Agent');
    assert.strictEqual(r.meta.model, 'claude-3');
    assert.strictEqual(r.body, 'This is the body.');
});

test('no frontmatter returns empty meta and full text as body', function () {
    var r = _parseFrontmatter('# Hello\nWorld');
    assert.deepStrictEqual(r.meta, {});
    assert.strictEqual(r.body, '# Hello\nWorld');
});

test('unclosed frontmatter (no closing ---) treated as no frontmatter', function () {
    var r = _parseFrontmatter('---\nname: X\nno closing delimiter');
    assert.deepStrictEqual(r.meta, {});
});

// ─── _parseAndLoadAgent ───────────────────────────────────────────────────────

console.log('\n_parseAndLoadAgent');

test('Claude Code .md with frontmatter', function () {
    var text = '---\nname: Sales Bot\ndescription: B2B sales expert\nmodel: claude-opus-4-7\n---\nYou are a sales expert.';
    var r = _parseAndLoadAgent('sales-bot.md', text);
    assert.strictEqual(r.agent_type, 'claude');
    assert.strictEqual(r.name, 'Sales Bot');
    assert.strictEqual(r.model, 'claude-opus-4-7');
    assert.strictEqual(r.system_prompt, 'You are a sales expert.');
});

test('GitHub Copilot .agent.md with frontmatter', function () {
    var text = '---\nname: DevOps Agent\ndescription: CI/CD helper\ntarget: devops\n---\nHelp with pipelines.';
    var r = _parseAndLoadAgent('devops.agent.md', text);
    assert.strictEqual(r.agent_type, 'github');
    assert.strictEqual(r.name, 'DevOps Agent');
    assert.strictEqual(r.copilot_topic, 'devops');
});

test('GitHub Copilot free-form .md (no frontmatter)', function () {
    var text = '# Code Reviewer\n**Topic:** security\nReview code for issues.';
    var r = _parseAndLoadAgent('copilot-instructions.md', text);
    assert.strictEqual(r.agent_type, 'github');
    assert.strictEqual(r.name, 'Code Reviewer');
    assert.strictEqual(r.copilot_topic, 'security');
    assert.ok(r.system_prompt.includes('Review code'));
});

test('iAgentshub JSON pass-through (id discarded)', function () {
    var text = JSON.stringify({ id: 'abc123', agent_type: 'claude', name: 'Test', system_prompt: 'Hello' });
    var r = _parseAndLoadAgent('agent.json', text);
    assert.strictEqual(r.agent_type, 'claude');
    assert.strictEqual(r.name, 'Test');
    assert.strictEqual(r.id, undefined);
});

test('OpenAI Assistants JSON (instructions field)', function () {
    var text = JSON.stringify({ name: 'GPT Agent', instructions: 'You are helpful.', model: 'gpt-4o', tool_choice: 'auto' });
    var r = _parseAndLoadAgent('openai-export.json', text);
    assert.strictEqual(r.agent_type, 'openai');
    assert.strictEqual(r.system_prompt, 'You are helpful.');
    assert.strictEqual(r.tool_choice, 'auto');
});

test('Claude API JSON (extended_thinking field)', function () {
    var text = JSON.stringify({ name: 'Thinker', system_prompt: 'Think deep.', extended_thinking: true, thinking_budget_tokens: 5000 });
    var r = _parseAndLoadAgent('claude-export.json', text);
    assert.strictEqual(r.agent_type, 'claude');
    assert.strictEqual(r.extended_thinking, true);
    assert.strictEqual(r.thinking_budget_tokens, 5000);
});

test('Generic JSON fallback', function () {
    var text = JSON.stringify({ name: 'Generic', system_prompt: 'Do stuff.' });
    var r = _parseAndLoadAgent('generic.json', text);
    assert.strictEqual(r.agent_type, 'generic');
    assert.strictEqual(r.system_prompt, 'Do stuff.');
});

test('Invalid JSON throws', function () {
    assert.throws(function () { _parseAndLoadAgent('bad.json', 'not json'); });
});

// ─── Routines — propagación en imports ───────────────────────────────────────

console.log('\nRoutines — import propagation');

var _sampleRoutines = [
    { name: 'Morning briefing', trigger_type: 'cron', schedule: '0 9 * * MON-FRI', prompt: 'Summarize tasks.' },
    { name: 'Weekly report', trigger_type: 'manual', prompt: 'Generate weekly report.' },
];

test('iAgentshub JSON pass-through preserves routines', function () {
    var text = JSON.stringify({ agent_type: 'claude', name: 'Bot', routines: _sampleRoutines });
    var r = _parseAndLoadAgent('agent.json', text);
    assert.strictEqual(r.routines.length, 2);
    assert.strictEqual(r.routines[0].name, 'Morning briefing');
    assert.strictEqual(r.routines[0].trigger_type, 'cron');
});

test('Claude API JSON preserves routines', function () {
    var text = JSON.stringify({ name: 'Thinker', system_prompt: 'x', extended_thinking: true, routines: _sampleRoutines });
    var r = _parseAndLoadAgent('claude.json', text);
    assert.strictEqual(r.routines.length, 2);
    assert.strictEqual(r.routines[1].trigger_type, 'manual');
});

test('OpenAI JSON preserves routines', function () {
    var text = JSON.stringify({ name: 'GPT', instructions: 'x', tool_choice: 'auto', routines: _sampleRoutines });
    var r = _parseAndLoadAgent('openai.json', text);
    assert.strictEqual(r.routines.length, 2);
});

test('Generic JSON preserves routines', function () {
    var text = JSON.stringify({ name: 'Generic', system_prompt: 'x', routines: _sampleRoutines });
    var r = _parseAndLoadAgent('generic.json', text);
    assert.strictEqual(r.routines.length, 2);
});

test('JSON without routines defaults to empty array', function () {
    var text = JSON.stringify({ name: 'No routines', system_prompt: 'x' });
    var r = _parseAndLoadAgent('generic.json', text);
    assert.deepStrictEqual(r.routines, []);
});

test('iAgentshub JSON without routines defaults to empty array', function () {
    var text = JSON.stringify({ agent_type: 'generic', name: 'No routines' });
    var r = _parseAndLoadAgent('agent.json', text);
    assert.deepStrictEqual(r.routines, []);
});

// ─── _parseAndLoadSkill ───────────────────────────────────────────────────────

console.log('\n_parseAndLoadSkill');

test('valid skill JSON', function () {
    var text = JSON.stringify({ name: 'My Skill', description: 'Does stuff', icon: '🔧', category: 'dev', content: 'Instructions...' });
    var r = _parseAndLoadSkill(text);
    assert.strictEqual(r.name, 'My Skill');
    assert.strictEqual(r.icon, '🔧');
    assert.strictEqual(r.category, 'dev');
});

test('id field is discarded', function () {
    var text = JSON.stringify({ id: 'should-be-gone', name: 'Skill', content: 'x' });
    var r = _parseAndLoadSkill(text);
    assert.strictEqual(r.id, undefined);
});

test('missing name throws', function () {
    assert.throws(function () { _parseAndLoadSkill(JSON.stringify({ content: 'x' })); }, /name/);
});

// ─── _parseAndLoadMemory ──────────────────────────────────────────────────────

console.log('\n_parseAndLoadMemory');

test('.md file uses filename without extension', function () {
    var r = _parseAndLoadMemory('my-agent.md', '# Context\nSome content');
    assert.strictEqual(r.filename, 'my-agent');
    assert.ok(r.content.includes('Some content'));
});

test('.json file reads filename and content fields', function () {
    var text = JSON.stringify({ filename: 'custom-name', content: 'The content' });
    var r = _parseAndLoadMemory('export.json', text);
    assert.strictEqual(r.filename, 'custom-name');
    assert.strictEqual(r.content, 'The content');
});

test('.json without filename field falls back to json filename stem', function () {
    var text = JSON.stringify({ content: 'hello' });
    var r = _parseAndLoadMemory('agent-memory.json', text);
    assert.strictEqual(r.filename, 'agent-memory');
});

test('compound filename strips only last extension', function () {
    var r = _parseAndLoadMemory('my.agent.md', 'data');
    assert.strictEqual(r.filename, 'my.agent');
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + (failed === 0 ? '✓' : '✗') + ' ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
