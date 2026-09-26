This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Production (`developer.pivota.cc`, `agents.pivota.cc`) is the Cloud Run service `agents-portal`
(GCP project `pivota-prod`, region `us-west1`), behind the `pivota-urlmap` load balancer.

**Merging to `main` deploys it.** `.github/workflows/deploy-cloud-run.yml` builds the Dockerfile,
pushes `agents-portal:<short sha>`, rolls the service with `--image` only (env and scaling stay as
configured on the service) and checks that the serving revision runs that image. `build.yml` builds
every PR first. The Vercel project was disconnected from Git on 2026-09-26 and serves neither host.

Rollback: run the "Deploy to Cloud Run" workflow by hand with the `sha` of an earlier commit on
`main`. It lasts until the next merge; to hold it, revert the bad commit.

If the workflow cannot run, build and deploy by hand from a clean checkout of the commit (the upload
is the working tree minus `.gitignore`d paths, so uncommitted edits would ship):

```bash
gcloud builds submit --region us-west1 --config cloudbuild.yaml --substitutions _TAG=$(git rev-parse --short HEAD) .
```

```bash
gcloud run deploy agents-portal --region us-west1 --image us-west1-docker.pkg.dev/pivota-prod/cloud-run-source-deploy/agents-portal:<sha>
```

`NEXT_PUBLIC_API_URL` (`https://api.pivota.cc`, the `ARG` default in the `Dockerfile`) is a Docker
**build arg**, not a Cloud Run env var: Next.js inlines it into the client bundle and the
`/developers/docs` rewrites at build time, so changing it on the service does nothing until a rebuild.
`output: "standalone"` in `next.config.ts` is what produces the `server.js` the Dockerfile runs.

## Brand System

This app uses Pivota Brand Kit v2.0 from `public/pivota-brand/`. Treat `public/pivota-brand/CLAUDE.md` as the local source of truth for logo, favicon, color, and brand-token usage.
