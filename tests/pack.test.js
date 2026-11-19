/* Ce que la revue d'extensions.gnome.org a refusé sur la 1.0.0 : un
 * gschemas.compiled dans l'archive (inutile dès GNOME 45) et un signal du menu
 * jamais déconnecté.
 *
 *     gjs -m tests/pack.test.js
 *
 * Le schéma est compilé d'abord, comme le fait install.sh, pour vérifier que
 * pack.sh le laisse dehors même quand il traîne dans le clone.
 */

import GLib from 'gi://GLib';
import System from 'system';

const UUID = 'claude-usage@salvadorcardona.github.io';

let failed = 0;

function check(what, ok) {
    if (!ok) {
        failed++;
        printerr(`ÉCHEC ${what}`);
    } else {
        print(`ok ${what}`);
    }
}

function run(argv) {
    const [, out, err, status] = GLib.spawn_sync(null, argv, null,
        GLib.SpawnFlags.SEARCH_PATH, null);
    if (status !== 0)
        throw new Error(`${argv.join(' ')} : ${new TextDecoder().decode(err)}`);
    return new TextDecoder().decode(out);
}

run(['glib-compile-schemas', 'schemas']);
const out = GLib.dir_make_tmp('claude-usage-pack-XXXXXX');
run(['./pack.sh', out]);
const listing = run(['unzip', '-Z1', `${out}/${UUID}.shell-extension.zip`]);
run(['rm', '-rf', out]);

check('pas de gschemas.compiled dans l\'archive', !listing.includes('gschemas.compiled'));
check('le .gschema.xml dans l\'archive',
    listing.split('\n').includes('schemas/org.gnome.shell.extensions.claude-usage.gschema.xml'));

const [, bytes] = GLib.file_get_contents('extension.js');
const source = new TextDecoder().decode(bytes);
check('open-state-changed gardé pour être déconnecté',
    /this\._menuOpenId = this\.menu\.connect\('open-state-changed'/.test(source));
check('open-state-changed déconnecté', source.includes('this.menu.disconnect(this._menuOpenId)'));
check('plus de this._destroyed', !source.includes('this._destroyed'));

System.exit(failed ? 1 : 0);
