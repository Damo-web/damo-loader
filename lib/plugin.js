const qs = require('querystring')
const RuleSet = require('webpack/lib/RuleSet')

const id = 'damo-loader-plugin'
const NS = 'damo-loader'

//不同于loader对source的处理，Plugin主要用途在于改变webpack编译及解析的过程
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

    //通过RuleSet创建新匹配规则
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
    // 获取 damo-loader 的索引
    const damoLoaderUseIndex = vueUse.findIndex(u => {
      return /^damo-loader|(\/|\\|@)damo-loader/.test(u.loader)
    })

    //damo-loader 索引的容错判断
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

    //除vue rule，对每条规则进行克隆
    const clonedRules = rules
      .filter(r => r !== vueRule)
      .map(cloneRule)

    // 全局pitcher ，用来注入template及css loader
    const pitcher = {
      loader: require.resolve('./loaders/pitcher'),
      resourceQuery: query => {
        const parsed = qs.parse(query.slice(1))
        return parsed.vue != null
      },
      options: {
        cacheDirectory: damoLoaderUse.options.cacheDirectory,
        cacheIdentifier: damoLoaderUse.options.cacheIdentifier
      }
    }

    //替换原始规则
    compiler.options.module.rules = [
      pitcher,
      ...clonedRules,
      ...rules
    ]
    
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

function cloneRule (rule) {
  const { resource, resourceQuery } = rule
  // Assuming `test` and `resourceQuery` tests are executed in series and
  // synchronously (which is true based on RuleSet's implementation), we can
  // save the current resource being matched from `test` so that we can access
  // it in `resourceQuery`. This ensures when we use the normalized rule's
  // resource check, include/exclude are matched correctly.
  let currentResource
  const res = Object.assign({}, rule, {
    resource: {
      test: resource => {
        currentResource = resource
        return true
      }
    },
    resourceQuery: query => {
      const parsed = qs.parse(query.slice(1))
      if (parsed.vue == null) {
        return false
      }
      if (resource && parsed.lang == null) {
        return false
      }
      const fakeResourcePath = `${currentResource}.${parsed.lang}`
      if (resource && !resource(fakeResourcePath)) {
        return false
      }
      if (resourceQuery && !resourceQuery(query)) {
        return false
      }
      return true
    }
  })

  if (rule.oneOf) {
    res.oneOf = rule.oneOf.map(cloneRule)
  }

  return res
}

DamoLoaderPlugin.NS = NS
module.exports = DamoLoaderPlugin