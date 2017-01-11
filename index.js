#!/usr/bin/env node
var babel=require("babel-core")
var result=babel.transformFileSync(__dirname+'/app.js')
eval(result.code)
