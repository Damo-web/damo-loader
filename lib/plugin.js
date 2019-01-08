const qs = require('querystring')
const RuleSet = require('webpack/lib/RuleSet')

const id = 'damo-loader-plugin'
const NS = 'damo-loader'

class DamoLoaderPlugin{
  apply(compiler) {
    // 给loader增加一个namespace以做标识
    if (compiler.hooks) {
      // webpack 4
      // 编译(compilation)创建之后，执行插件。
      compiler.hooks.compilation.tap(id, compilation => {
        compilation.hooks.normalModuleLoader.tap(id, loaderCtx => {
          loaderCtx[NS] = true
        })
      })
    }else{
      // webpack < 4
      compiler.plugin('compilation', compilation => {
        compilation.plugin('normal-module-loader', loaderCtx => {
          loaderCtx[NS] = true
        })
      })
    }

    //注入RuleSet匹配规则
    //获取初始规则，即{test: /\.vue$/,loader: 'damo-loader'}
    const rawRules = compiler.options.module.rules
    const { rules } = new RuleSet(rawRules)

    // 验证.vue文件是否存在
    // foo.vue及foo.vue.html 两个格式
    let vueRuleIndex = rawRules.findIndex(createMatcher(`foo.vue`))
    if (vueRuleIndex < 0) {
      vueRuleIndex = rawRules.findIndex(createMatcher(`foo.vue.html`))
    }
    const vueRule = rules[vueRuleIndex]

    if(!vueRule){
      throw new Error('[DamoLoaderUseIndex Error] DamoLoaderPlugin没检测到.vue文件！')
    }

    if (vueRule.oneOf) {
      throw new Error(
        '[DamoLoaderUseIndex Error] DamoLoaderPlugin暂不支持oneOf！'
      )
    }

    // 获取 Rule 下的use
    const vueUse = vueRule.use
    // 获取 damo-loader
    const damoLoaderUseIndex = vueUse.findIndex(u => {
      return /^damo-loader|(\/|\\|@)damo-loader/.test(u.loader)
    })

    if (damoLoaderUseIndex < 0) {
      throw new Error(
        `[DamoLoaderUseIndex Error] damo-loader不存在`
      )
    }

    //template-loader添加标志
    //template-loader??vue-loader-options
    const damoLoaderUse = vueUse[damoLoaderUseIndex]
    damoLoaderUse.ident = 'damo-loader-options'
    damoLoaderUse.options = damoLoaderUse.options || {}

    console.log(vueRule,8888)
    
  }
}

function createMatcher (fakeFile) {
  return rule => {
    //跳出damo-loader中`include`检测
    const clone = {...rule}
    delete clone.include
    const normalized = RuleSet.normalizeRule(clone, {}, '')
    return (
      !rule.enforce &&
      normalized.resource &&
      normalized.resource(fakeFile)
    )
  }
}

DamoLoaderPlugin.NS = NS
module.exports = DamoLoaderPlugin