export type AccessLevel = 'READ' | 'WRITE' | 'ADMIN'
const rank = {READ:1, WRITE:2, ADMIN:3}
export function levelAllows(level:AccessLevel | null | undefined,required:AccessLevel):boolean {return !!level && rank[level]>=rank[required]}
export function canAccessRoute(levels:Record<string,AccessLevel>,slug:string|undefined):boolean {return !slug || !!levels[slug]}
