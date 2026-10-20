/* La page de présentation (docs/) est servie sous hermez.dev : aucune trace de
 * l'ancien domaine ni d'un nom de personne, canonique et JSON-LD sur hermez.dev.
 *
 *     gjs -m tests/site.test.js
 */

import GLib from 'gi://GLib';
import System from 'system';

const SITE = 'https://hermez.dev/gnome-claude-usage/';

let failed = 0;

function check(what, ok) {
    if (!ok) {
        failed++;
        printerr(`ÉCHEC ${what}`);
    } else {
        print(`ok ${what}`);
    }
}

function read(path) {
    const [, bytes] = GLib.file_get_contents(path);
    return new TextDecoder().decode(bytes);
}

const html = read('docs/index.html');

// cardona.digital ne fait plus que rediriger ; l'instance Umami, elle, y
// reste, comme le reste de l'infrastructure.
for (const path of ['docs/index.html', 'docs/llms.txt', 'docs/robots.txt',
    'docs/sitemap.xml', 'README.md', 'README.fr.md', 'metadata.json', 'prefs.js']) {
    const text = read(path).replaceAll('https://umami.cardona.digital/', '');
    check(`${path} sans cardona.digital`, !text.includes('cardona.digital'));
}
for (const path of ['docs/index.html', 'docs/llms.txt', 'README.md', 'README.fr.md'])
    check(`${path} sans nom de personne`, !read(path).includes('Salvador Cardona'));

check('canonique', html.includes(`<link rel="canonical" href="${SITE}">`));
check('og:url', html.includes(`<meta property="og:url" content="${SITE}">`));
check('og:image', html.includes(`<meta property="og:image" content="${SITE}`));
check('twitter:image', html.includes(`<meta name="twitter:image" content="${SITE}`));
check('Umami compte hermez.dev',
    /<script src="https:\/\/umami\.[^"]+" [^>]*data-domains="hermez\.dev"/.test(html));

const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
check('JSON-LD url', ld.url === SITE);
check('JSON-LD auteur Hermez', JSON.stringify(ld.author) ===
    JSON.stringify({'@type': 'Organization', name: 'Hermez', url: 'https://hermez.dev'}));

check('sitemap', read('docs/sitemap.xml').includes(`<loc>${SITE}</loc>`));
check('robots', read('docs/robots.txt').includes(`Sitemap: ${SITE}sitemap.xml`));
check('metadata.json url', JSON.parse(read('metadata.json')).url === SITE);
check('README signé', read('README.md').includes('A Hermez product'));
check('README.fr signé', read('README.fr.md').includes('Un produit Hermez'));

System.exit(failed ? 1 : 0);
