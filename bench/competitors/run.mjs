// Verification-branch entry point for the existing Native CI workflow.
if (process.versions.node.split('.')[0] === '24') await import('../native-block-verify.mjs');
