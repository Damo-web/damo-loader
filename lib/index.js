//node模块
const path = require('path')
const hash = require('hash-sum')
const qs = require('querystring')

//第三方包
const loaderUtils = require('loader-utils')
const { parse } = require('@vue/component-compiler-utils')

//lib plugin模块
const plugin = require('./plugin')
const { NS } = require('./plugin')

//lib core模块
const selectBlock = require('./select')
const { attrsToQuery } = require('./codegen/utils')
const componentNormalizerPath = require.resolve('./runtime/componentNormalizer')


//检测vue-template-compiler
function loadVueTemplateCompiler () {
  try {
    return require('vue-template-compiler')
  } catch (e) {
    throw new Error(
      `damo-loader 必须需要配置一个compiler，否则无法编译传入的JavaScript 源码`
    )
  }
}


module.exports = function (source) {

  console.log(`\x1b[30m${source}`);
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


  //loader 工具库
  //https://github.com/webpack/loader-utils
  //不要在模块代码中插入绝对路径，因为当项目根路径变化时，文件绝对路径也会变化
  //因webpack会利用模块路径转换为hash化的模块id，为了确保hash的一致性，避免使用绝对路径（/与\两符号hash化后的值不同）
  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderCtx, r)

  const rawQuery = resourceQuery.slice(1)
  const inheritQuery = `&${rawQuery}`
  const incomingQuery = qs.parse(rawQuery)

  console.log(this.resourceQuery,23333)

  //loaderUtils.getOptions 用来获取传递给 loader 的选项
  //无传入项 options则为 {}
  const options = loaderUtils.getOptions(loaderCtx) || {}
  //resourcePath为当前文件的绝对路径
  //path.basename 返回 path 的最后一部分
  //这里filename即为source.vue
  const filename = path.basename(resourcePath)
  //process.cwd() 返回进程的当前工作目录
  //这里context即为当前工作目录
  const context = rootContext || process.cwd()
  //sourceRoot为当前source.vue 文件的example
  const sourceRoot = path.dirname(path.relative(context, resourcePath))

  const descriptor = parse({
    source,
    compiler: options.compiler || loadVueTemplateCompiler(),
    filename,
    sourceRoot,
    needMap: sourceMap
  })

  if (incomingQuery.type) {
    return selectBlock(
      descriptor,
      loaderCtx,
      incomingQuery,
      !!options.appendExtension
    )
  }

  console.log(descriptor)

  // module id for scoped CSS & hot-reload
  // 绝对路径及系统（/与\）处理
  const rawShortFilePath = path
    .relative(context, resourcePath)
    .replace(/^(\.\.[\/\\])+/, '')
  const shortFilePath = rawShortFilePath.replace(/\\/g, '/') + resourceQuery
  const id = hash(shortFilePath)
  // feature information
  const hasScoped = descriptor.styles.some(s => s.scoped)
  const hasFunctional = descriptor.template && descriptor.template.attrs.functional

  // template
  let templateImport = `var render, staticRenderFns`
  let templateRequest
  if (descriptor.template) {
    //绝对路径
    const src = descriptor.template.src || resourcePath
    const idQuery = `&id=${id}`
    const scopedQuery = hasScoped ? `&scoped=true` : ``
    const attrsQuery = attrsToQuery(descriptor.template.attrs)
    const query = `?vue&type=template${idQuery}${scopedQuery}${attrsQuery}${inheritQuery}`
    const request = templateRequest = stringifyRequest(src + query)
    templateImport = `import { render, staticRenderFns } from ${request}`
  }

  // script
  let scriptImport = `var script = {}`
  if (descriptor.script) {
    const src = descriptor.script.src || resourcePath
    const attrsQuery = attrsToQuery(descriptor.script.attrs, 'js')
    const query = `?vue&type=script${attrsQuery}${inheritQuery}`
    const request = stringifyRequest(src + query)
    scriptImport = (
      `import script from ${request}`
    )
  }

  // styles
  let stylesCode = ``

  let code = `
    ${templateImport}
    ${scriptImport}
    ${stylesCode}
    
    /* normalize component */
    import normalizer from ${stringifyRequest(`!${componentNormalizerPath}`)}
    var component = normalizer(
      script,
      render,
      staticRenderFns,
      ${hasFunctional ? `true` : `false`},
      ${/injectStyles/.test(stylesCode) ? `injectStyles` : `null`},
      ${hasScoped ? JSON.stringify(id) : `null`}
    )
      `.trim() + `\n`
  
  // Expose filename. This is used by the devtools and Vue runtime warnings.
  code += `\ncomponent.options.__file = ${
    JSON.stringify(rawShortFilePath.replace(/\\/g, '/'))
  }`

  code += `\nexport default component.exports`

  console.log(`\x1b[34m${code}`);
  
  return code
}

//导出plugin
module.exports.damoLoaderPlugin = plugin