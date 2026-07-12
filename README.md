# Staff Chat

**This project is paused.** The site currently shows a simple "we'll be back
soon" splash page (`index.html`) instead of the app.

No build step, no dependencies, no config needed — it's a single static HTML
file. Netlify (or any static host) can serve this repo as-is.

## Bringing the app back

The full app — Firebase auth, servers, channels, real-time chat, staff admin
dashboard — isn't deleted, just parked in git history. To resume:

```bash
git log --oneline           # find the last commit before the pause
git revert <this-commit>    # or check out an earlier commit to restore it
```

The last working version of the app is the commit just before this one.
