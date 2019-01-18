// 返回对应模块的源码及source map
module.exports = function selectBlock (
  descriptor,
  loaderCtx,
  query,
  appendExtension
){
  // template
  if(query.type === "template"){
    if (appendExtension) {
      loaderCtx.resourcePath += '.' + (descriptor.template.lang || 'html')
    }
    // 通过 loaderContext.callback 告诉 Webpack 返回的结果
    loaderCtx.callback(
      null,
      descriptor.template.content,
      descriptor.template.map
    )
    // 当你使用 loaderContext.callback 返回内容时，该 Loader 必须返回 undefined，
    // 以让 Webpack 知道该 Loader 返回的结果在 loaderContext.callback 中，而不是 return 中
    return
  }
  // script
  if (query.type === `script`) {
    if (appendExtension) {
      loaderCtx.resourcePath += '.' + (descriptor.script.lang || 'js')
    }
    loaderCtx.callback(
      null,
      descriptor.script.content,
      descriptor.script.map
    )
    return
  }

  // styles
  if (query.type === `style` && query.index != null) {
    const style = descriptor.styles[query.index]
    if (appendExtension) {
      loaderCtx.resourcePath += '.' + (style.lang || 'css')
    }
    loaderCtx.callback(
      null,
      style.content,
      style.map
    )
    return
  }

  // custom
  if (query.type === 'custom' && query.index != null) {
    const block = descriptor.customBlocks[query.index]
    loaderCtx.callback(
      null,
      block.content,
      block.map
    )
    return
  }
}