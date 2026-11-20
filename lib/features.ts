/**
 * Build-time feature flags.
 *
 * NEXT_PUBLIC_* values are inlined by `next build`, so a flag is fixed per image: the
 * Dockerfile ARG and the deploy workflow's --build-arg decide it, not the Cloud Run env.
 *
 * To keep a flagged-off module OUT of the bundle (not merely unrendered), gate its
 * `require` on the literal `process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === 'true'`
 * expression at the call site: webpack folds that constant and drops the dead branch.
 * A boolean imported from here can't be folded across modules.
 */
export const PORTAL_V2_ENABLED = process.env.NEXT_PUBLIC_FEATURE_PORTAL_V2 === 'true';
