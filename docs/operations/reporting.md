# Sprint 2: citizen reporting

## Hosted migration

On the existing project, run only `supabase/migrations/202609110003_reporting.sql` in Supabase SQL Editor. The earlier foundation/identity setup is already applied; do not rerun it. No service-role key or password is needed by the web app.

The migration creates issues, media, immutable client-facing history, the private issue-photos bucket, RLS policies and the submit_issue function. It is transaction-wrapped and should be run once. If any statement fails, share the error before retrying. Local SQL tests emulate the storage schema; hosted Storage API behavior needs the acceptance check below.

## Design

- A server action verifies an active citizen, validates inputs, decodes and normalizes a JPEG/PNG/WebP, strips metadata and uploads with the citizen session.
- Maximum source size 5 MB, maximum decoded image 40 million pixels, normalized long edge 1920 px. SVG, animated images, unreadable content and larger files are rejected.
- Database RPC derives reporter identity from auth.uid(), validates category and photo path, and atomically creates the report, media, initial SUBMITTED history and audit event.
- A per-form UUID is the retry key. Repeating a committed submission returns its existing ID. A SQL failure rolls back all report records.
- Failed RPCs attempt orphan cleanup through Storage API. Policy forbids deletion of attached evidence. Network interruption can leave unattached private files; review and remove confirmed unattached files through Storage API in an operational cleanup job before pilot release. Never delete storage metadata rows directly.
- Storage permits users to insert only under their own UUID prefix; photos are not public or overwritable. Signed image links expire after five minutes; refresh a detail page if needed.
- Active citizens can read only their own issues, media and history. Staff access and status updates arrive in Sprint 3.
- Category default department is the temporary routing fallback; ward stays unassigned until geographic routing is implemented. Manual address/landmark entry avoids implying a geocoded address.
- Map uses Leaflet and OpenStreetMap tiles with attribution. GPS is requested only when clicked; coordinate inputs remain available when GPS/tiles fail. Public tile requests go to OpenStreetMap.
- Form errors preserve fields and the selected photo while the page stays open. Persistent offline drafts are still Sprint 6.

## Verify

Run `npm run check` for TypeScript, database and photo tests, and production build. With the app running, `node --test tests/e2e/anonymous.test.mjs` checks public/anonymous routes.

Hosted manual acceptance:
1. Sign in as a citizen, choose Report an issue.
2. Select a JPEG/PNG/WebP photo under 5 MB; add title, description and category.
3. Deny GPS permission, then select a point on the map or enter valid coordinates. Add a landmark.
4. Submit and check the reference, photo and SUBMITTED timeline.
5. Sign out and sign back in; retrieve the report from My complaints.
6. Sign in as a different citizen and visit the first citizen's detail URL; expect a not-found result.
7. Confirm another citizen cannot fetch the photo through the authenticated Storage API.
8. Test corrupt/oversized images and unavailable-network submission; verify a useful error and preserved form.

Implementation references: [Supabase storage policies](https://supabase.com/docs/guides/storage/security/access-control), [Leaflet API](https://leafletjs.com/reference.html).


Hosted migration applied without errors (user confirmed). Read-only hosted checks returned 401 / permission denied for anonymous reads of issues, issue_media and status_history. All eight local tests, TypeScript, production build and protected-route smoke checks passed. Signed-in photo delivery and second-account Storage API tests remain manual checks.

## Photo previews and location fallback — September 13, 2026

My complaints now includes uploaded photo thumbnails in compact responsive cards. Detail pages use the same authenticated image endpoint with no-store responses and explicit retry controls, replacing expiring signed URLs. Image requests query media and Storage using the current user session and its ownership policies.

Location capture tries a quick lower-accuracy fix first, then a precise fix. If the browser/device cannot provide coordinates, users can search a public town/street/landmark with Photon, select the result and adjust the map pin. A search result is not represented as a device GPS fix. GPS accuracy is cleared on manual selection. No code change can force a browser or OS location provider to return a position.

Search is user-triggered, authenticated, cached (bounded to 100 queries for one hour), and throttled per server process. PHOTON_SEARCH_URL can replace the default public Photon demo endpoint. Use a dedicated provider/instance and distributed request limits before scaling beyond the student pilot. The public endpoint has no availability guarantee. Only the search text is sent; the user is informed beside the field. See https://github.com/komoot/photon for provider terms.

Validation: TypeScript, twelve automated tests and the production build passed. A live Photon query returned coordinates for Clock Tower, Dehradun. Signed-in image rendering and actual device GPS remain manual verification because browser automation is unavailable in this session.
