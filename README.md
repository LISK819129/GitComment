<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="gitcomment.png">
    <img src="gitcomment-light.png" alt="GitComment" width="280">
  </picture>
</p>

# GitComment

A comments for your GitHub profile. People leave you a message with the GitHub
account they already have, and it shows up near the bottom of your profile README.

<table>
<tr><td colspan="2"><b>Comments</b><br><sub>little messages from people passing by.</sub></td></tr>
<tr><td width="60" align="center" valign="top"><a href="https://github.com/octocat"><img src="https://avatars.githubusercontent.com/u/583231?s=80&amp;v=4" width="40" height="40" alt="octocat"></a></td><td valign="top"><a href="https://github.com/octocat"><b>octocat</b></a> · <sub>25m ago</sub><br>found you through OpenNPC. really cool project</td></tr>
<tr><td width="60" align="center" valign="top"><a href="https://github.com/monalisa"><img src="https://avatars.githubusercontent.com/u/9919?s=80&amp;v=4" width="40" height="40" alt="monalisa"></a></td><td valign="top"><a href="https://github.com/monalisa"><b>monalisa</b></a> · <sub>19h ago</sub><br>+rep</td></tr>
<tr><td width="60" align="center" valign="top"><a href="https://github.com/hubot"><img src="https://avatars.githubusercontent.com/u/4004?s=80&amp;v=4" width="40" height="40" alt="hubot"></a></td><td valign="top"><a href="https://github.com/hubot"><b>hubot</b></a> · <sub>4d ago</sub><br>Desktop Drifter is sick :)</td></tr>
<tr><td colspan="2" align="center"><sub><a href="#setup">leave a message</a> · <a href="#setup">older messages (9)</a></sub></td></tr>
</table>

<sub>Example output. The accounts above are GitHub's own placeholder accounts.</sub>

That block is generated. You never edit it by hand, and nobody but you can write
to your README.

## How it works

Comments live in a GitHub Discussion on your profile repository. When somebody
comments, a workflow runs, reads the newest comments over the GraphQL API,
renders them, and commits the result between two markers in your README.

```
Discussion comment
      |
      v
discussion_comment event
      |
      v
GitComment action  ->  reads the Discussion (GraphQL)
      |                renders the newest N
      v
README.md, between the markers
```

Your repository stays yours. The Discussion is the full history; the README is a
small window onto the last few messages. Nothing is deleted when it scrolls off.

There is no database, no server, no signup and no GitComment account. A
visitor's GitHub identity is their identity.

## Setup

About five minutes.

**1. Enable Discussions** on your profile repository — the one named after your
username. Settings, General, Features, Discussions.

**2. Create the comments Discussion.** One discussion, any category. Something
like:

```
Comments

Leave a message on my profile.

Say hi, leave some feedback, +rep me, tell me how you found my
profile, or just leave something stupid.
```

Note its number from the URL: `/discussions/1` means `1`.

**3. Add the markers** to your README, wherever you want the comments:

```
<!-- GITCOMMENT:START -->
<!-- GITCOMMENT:END -->
```

**4. Add the workflow** at `.github/workflows/comments.yml`:

```yaml
name: comments

on:
  discussion_comment:
    types: [created, edited, deleted]
  workflow_dispatch:

concurrency:
  group: comments
  cancel-in-progress: false

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      discussions: read
    steps:
      - uses: OWNER/gitcomment@v1
        with:
          discussion-number: 1
```

Commit that to your **default branch**. GitHub only fires `discussion_comment`
for workflows that live there.

Then run it once by hand from the Actions tab to fill in the README, and leave
yourself a test comment to check the trigger works.

There is no `actions/checkout` step. The action reads and writes through the
API, which also means two people commenting at the same moment can't clobber
each other.

## Config

All optional. Put this at `.github/gitcomment.yml`:

```yaml
title: "Comments"
subtitle: "little messages from people passing by."

theme: cozy

max_comments: 5
message_max_length: 240

show_avatar: true
show_date: true

moderation: automatic
blocked_users: []
```

`max_comments` is how many appear in the README, not how many are kept. The rest
stay in the Discussion, behind the "older messages" link.

The action also takes `theme` and `max-comments` as inputs, and those win over
the file. The full input list is in `action.yml`.

### Moderation

`automatic` shows every comment as it arrives. You moderate afterwards using
GitHub itself: hide a comment with the Hide menu and GitComment drops it on the
next run, or add the author to `blocked_users`.

`approved` shows nothing until you react to the comment yourself. Add a 👍 and it
appears on the next run.

```yaml
moderation: approved
approval_reaction: heart
```

Reactions, because they work from the GitHub mobile app and need no extra
tooling. Only reactions from the repository owner count.

## Themes

Three of them are plain README HTML. Two draw an SVG and commit it next to your
README.

**HTML themes** — a couple of kilobytes, every username clickable, avatars
served live from GitHub.

`cozy` is the default: one bordered block, avatar on the left, title and links
built in.

`steam` borrows the shape of a Steam profile comment — name above a small
timestamp, message underneath, an action button at the bottom. The layout only;
no Steam assets, branding or styling.

`minimal` uses no tables at all. Small avatars, blockquoted messages, looks like
the rest of a README.

**Drawn themes** — GitHub strips CSS from README HTML, so anything with tilt,
shadow, tape or a handwriting font has to be an image.

`notes` draws the whole comments as a corkboard: white notes at slight angles,
tape, circular avatars, handwritten margin scribbles. Around 30 KB, rewritten on
every comment. Because it's one image, nothing inside it is clickable, so the
usernames are repeated as a small text row underneath. The board has a dark
background and does not follow GitHub's light theme.

`drawn` is the middle ground. A handwritten header is generated **once** and then
left alone; the comments below it are ordinary HTML rows with live avatars and
working links. You get the handmade framing without rewriting an image every time
somebody says hi.

Message text in both drawn themes uses the reader's system sans. Only the title
and the margin scribbles use the handwriting face, which ships subsetted to the
glyphs it needs (15 KB) and is embedded in the SVG, since GitHub's image proxy
cannot fetch fonts.

## What GitHub actually allows

Worth knowing before filing a bug about something looking off.

- **No CSS, no JavaScript, no iframes.** GitHub strips `style` and `class` from
  README HTML. Everything here is built from tags that survive: `table`, `img`,
  `a`, `sub`, `b`, `code`, `kbd`, `wbr`, `blockquote`.
- **Avatars can't be circles in the HTML themes.** That needs
  `border-radius: 50%` and inline styles are stripped. GitHub applies a 6px
  radius to README images itself, so they come out as rounded squares. The drawn
  themes clip them to circles inside the SVG instead.
- **No scrolling box.** A README can't have one, so GitComment doesn't fake one.
  You get the newest few messages and a link to the rest.
- **Tables size to their content**, so the block is as wide as its widest
  message rather than the full column.
- **Discussions are GraphQL-only.** There is no REST API for them.
- **`discussion_comment` only triggers workflows on the default branch**, and
  GitHub still lists Discussions webhooks as public preview.
- **SVGs must be a separate file.** GitHub's renderer drops inline `<svg>`, so a
  drawn theme commits an `.svg` and the README points an `<img>` at it. The `src`
  carries a content hash so GitHub's image cache picks up new versions.
- **Nothing inside an image is clickable**, and an SVG served that way cannot
  fetch anything external — which is why avatars are copied into the file.
- **Dates are drawn when the board is rendered**, not when somebody looks at it,
  which is why they are absolute (`22 Sep, 2026`) rather than relative. A picture
  cannot tell the time.

## Development

```
npm install
npm test
npm run build
```

To try it against a real Discussion without writing anything:

```
GITHUB_TOKEN=<token> npm run try -- <owner>/<repo> <discussion-number> [theme]
npm run serve
```

That reads the live Discussion, renders it, and drops the result in `tmp/local/`
plus a preview at `http://127.0.0.1:4173`. Nothing is committed. The token only
needs read access.

`npm run preview` renders every theme against the fixtures in
`test/fixtures.ts`, sends the markdown through GitHub's own Markdown API, and
writes `tmp/preview.html` so you can see what GitHub would do with it. The
fixtures include the awkward cases: XSS attempts, marker forgery, bidi
overrides, a deleted account, a 400-character ramble.

`npm run build` bundles `src/` into `dist/index.js` with ncc. That file is
committed, because GitHub Actions runs it directly.

## Security

Comments are untrusted input. Everything is HTML-escaped before rendering and a
small amount of formatting is re-applied afterwards — bold, italic, code, links,
line breaks. Images are reduced to their alt text. Links are limited to http and
https. Control characters and bidirectional overrides are stripped, and messages
are truncated. A commenter cannot forge the markers or inject markup into your
README.

## License

MIT
