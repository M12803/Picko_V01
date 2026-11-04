<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep imported Picko presentation, state, services and domain helpers in `src/features/picko`, with views under `views`; host URLs are defined exclusively by TanStack file routes so there is one router.
- Serve the original Picko `/api/*` JSON contracts from one catch-all server route that dispatches to `src/features/picko/server/api.server.ts`, backed by Lovable Cloud tables reachable only by the service role; the frontend stays unchanged and never persists orders in the browser.
- Keep multi-step or time-window order writes in database functions so undo/pickup windows are evaluated atomically on the database clock.
- Mount imported browser-dependent settings through ClientOnly to prevent server rendering from reading browser storage.
- Customer sound consent is separate from optional Web Push; only successful unmuted playback enables the sound state, so blocked playback stays retryable.
- Orders and archive share workspace palette tokens and one background token in global CSS so their colors cannot drift independently.
