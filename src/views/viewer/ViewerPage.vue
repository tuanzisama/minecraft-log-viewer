<template>
  <div>
    {{ edidorValue }}
  </div>
  <Input v-model="edidorValue" />
  <Button @click="onActivehandler">执行</Button>
  <div style="width: 100%; height: 400px; border: 2px solid gray">
    <monaco-editor v-model="edidorValue" ref="editorRef" />
  </div>
</template>

<script lang="ts" setup>
import MonacoEditor from "@/components/MonacoEditor";
import { ref } from "vue";

const editorRef = ref();
const edidorValue = ref("");

const onActivehandler = () => {
  edidorValue.value = new Date().toLocaleString();
};
</script>

<style lang="less" scoped></style>
