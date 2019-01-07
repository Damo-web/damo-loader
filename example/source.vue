<template>
  <div class="red">{{msg}}</div>
</template>

<script>
export default {
  data () {
    return {
      msg: 'hello loader'
    }
  }
}
</script>

<style scoped>
.red {
  color: red;
}
</style>

<foo>
export default comp => {
  console.log(comp.options.data())
}
</foo>