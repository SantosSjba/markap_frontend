import assert from 'node:assert/strict'
import {canAccessRoute,levelAllows} from '../src/modules/applications/domain/access-level'
export function run(){
 assert.equal(canAccessRoute({contabilidad:'READ'},'contabilidad'),true)
 assert.equal(canAccessRoute({},'contabilidad'),false)
 assert.equal(canAccessRoute({},undefined),true)
 assert.equal(levelAllows('WRITE','ADMIN'),false)
 assert.equal(levelAllows('READ','WRITE'),false)
 assert.equal(levelAllows('ADMIN','WRITE'),true)
 assert.equal(levelAllows(null,'READ'),false)
 console.log('PASS Niveles de lectura, edición y administración y acceso a rutas')
}
