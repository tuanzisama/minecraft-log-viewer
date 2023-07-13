<template>
  <!-- <div class="main-page" theme-mode="light"> -->
  <div class="main-page">
    <monaco-editor v-model="content" />
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import MonacoEditor from "../../components/MonacoEditor";

const content = ref("阿瓦达无大多无");
</script>

<style lang="less" scoped>
.main-page {
  width: 100%;
  height: 100%;
}
</style>
