# Navigation

The site uses plain HTML documents, CSS, and JavaScript. Serve the repository
as static files; no router fallback, build step, framework, or rewrite is needed.

## Public URLs

- Home: `/` (also `/index.html`)
- Home sections: `/index.html#engagements`, `/index.html#connect`
- UI/UX Work List: `/content.html`
- Other Work List tabs: `/content.html?tab=graphic`, `?tab=motion`,
  `?tab=illustration`, `?tab=personal`
- Projects: `/project1.html`, `/okr.html`, `/chatbot.html`, `/research.html`,
  `/cozyup.html`, `/materials.html`, `/sports.html`, `/bim.html`, `/food.html`,
  `/sustainability.html`, `/community.html`

Existing standalone creative and placeholder pages remain accessible at
`/graphic.html`, `/motion.html`, `/illustration.html`, `/personal.html`, and
`/more.html`. These are separate legacy pages, not aliases for the Work List tabs.

## Behavior

Use normal `<a href>` links between HTML documents. Never intercept them to
render pages in iframes: the document URL must match the displayed page.
Modified clicks and opening links in new tabs retain browser behavior.

`content.js` progressively enhances the tab links using `pushState` and
`popstate`, preserving the existing tab animations. The `tab` query selects the
same content after refresh or direct access. Project links keep their outgoing
dot animation, then navigate to the real project document. Page-specific
entrance animations and lightboxes remain owned by their original scripts.

`entry-guard.js` is a compatibility no-op. Direct links must not depend on a
prior Home visit or session storage. Old URLs containing `from` or `v` still
work; new links omit those navigation parameters. Asset cache versions remain.

Each HTML page has a canonical URL. Work List updates its title and canonical
URL for the selected tab. Tab content is still rendered by the existing vanilla
JavaScript; independent project pages contain their headings and content in HTML.

`music.js` only handles audio and saved playback state. A full document change
recreates audio, so playback can briefly pause and browser autoplay rules may
require a new user gesture. It must not control navigation.

## Manual verification

1. Open Home, navigate to Work List, and open a project. The address bar should
   change at each step and no page iframe should be created.
2. Use browser Back/Forward, switch tabs, refresh, and open tab links in new tabs.
3. Open project URLs in a fresh/private browser session and refresh them.
4. Use project return links and the Work List Home link; check Home appears once.
5. Test Home section links, language controls, image/video lightboxes, and
   back-to-top controls at desktop and mobile widths.
