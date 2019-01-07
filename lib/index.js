//node模块
const path = require('path')
const hash = require('hash-sum')
const qs = require('querystring')

//第三方包
const loaderUtils = require('loader-utils')
const { parse } = require('@vue/component-compiler-utils')

//检测vue-template-compiler
function loadTemplateCompiler () {
  try {
    return require('vue-template-compiler')
  } catch (e) {
    throw new Error(
      `[vue-loader] vue-template-compiler must be installed as a peer dependency, ` +
      `or a compatible compiler implementation must be passed via options.`
    )
  }
}

module.exports = function (source) {

  // console.log(`\x1b[30m${source}`);
  console.log("\x1b[35m分隔符 ------------------------------");

  const loaderCtx = this

  const {
    target,         
    request,        
    minimize,       
    sourceMap,      
    rootContext,    
    resourcePath,   
    resourceQuery  
  } = loaderCtx

  //path.basename 返回 path 的最后一部分
  //这里filename即为source.vue
  const filename = path.basename(resourcePath)
  //process.cwd() 返回进程的当前工作目录
  const context = rootContext || process.cwd()
  const sourceRoot = path.dirname(path.relative(context, resourcePath))


  const descriptor = parse({
    source,
    compiler: options.compiler || loadTemplateCompiler(),
    filename,
    sourceRoot,
    needMap: sourceMap
  })

  console.log(descriptor);

}
