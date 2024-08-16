export enum Status {
  noCode = 'noCode',
  covered = 'covered',
  partiallyCovered = 'partiallyCovered',
  notCovered = 'notCovered',
  notCoverable = 'notCoverable',
  undeterminedCoverage = 'undeterminedCoverage',
  disabledCoverage = 'disabledCoverage',
  exemptedNoViolation = 'exemptedNoViolation',
  exemptedWithViolation = 'exemptedWithViolation',
  exemptedWithUndetCov = 'exemptedWithUndetCov',
  // only for assembly coverage
  unknown = 'unknown',
  fallthroughTaken = 'fallthroughTaken',
  branchTaken = 'branchTaken',
}

export function initStatus(): Record<Status, number> {
  return {
    noCode: 0,
    covered: 0,
    partiallyCovered: 0,
    notCovered: 0,
    notCoverable: 0,
    undeterminedCoverage: 0,
    disabledCoverage: 0,
    exemptedNoViolation: 0,
    exemptedWithViolation: 0,
    exemptedWithUndetCov: 0,
    unknown: 0,
    fallthroughTaken: 0,
    branchTaken: 0,
  };
}
