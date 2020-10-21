export enum Status {
  noCode= 'noCode',
  covered= 'covered',
  partiallyCovered= 'partiallyCovered',
  notCovered= 'notCovered',
  notCoverable= 'notCoverable',
  exemptedNoViolation= 'exemptedNoViolation',
  exemptedWithViolation= 'exemptedWithViolation'
}

export function initStatus(): Record<Status, number>
{
  return {
    noCode: 0,
    covered: 0,
    partiallyCovered: 0,
    notCovered: 0,
    notCoverable: 0,
    exemptedNoViolation: 0,
    exemptedWithViolation: 0
  };
}
