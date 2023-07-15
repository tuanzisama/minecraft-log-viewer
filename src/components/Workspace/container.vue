<template>
  <div class="workspace-container">
    <monaco-editor ref="monacoEditorRef" v-model="privateValue" :theme="defaultEditorTheme" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import MonacoEditor, { MonacoEditorExpose } from "../../components/MonacoEditor";
import { useFileStore } from "../../plugins/store/modules/file";

const props = withDefaults(defineProps<WorkspaceProps>(), {});
const emit = defineEmits<WorkspaceEmits>();

const monacoEditorRef = ref<MonacoEditorExpose>();

const privateValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const fileStore = useFileStore();

defineExpose({ getEditorRef: () => monacoEditorRef.value });
</script>

<script lang="ts">
import { Ref } from "vue";
export interface WorkspaceProps {
  modelValue: string;
}

export interface WorkspaceEmits {
  (event: "update:modelValue", value: WorkspaceProps["modelValue"]): void;
}

export interface WorkspaceExpose {
  getEditorRef: () => MonacoEditorExpose;
}
</script>

<style lang="less" scoped>
.fileinfo-container {
  height: 60px;
  margin-bottom: var(--theme-padding);
  padding: calc(var(--theme-padding) / 2);
  font-family: "JetBrains Mono", monospace;
  .common-box();
  .flex-hcenter();
  .logfile-icon {
    width: 40px;
    height: 40px;
    background-color: var(--theme-background);
    border: 5px solid var(--theme-background);
    border-radius: 5px;
    margin-right: 10px;
    transition: all 0.3s;
    user-select: none;
    img {
      .img-contain();
    }
  }
  .logfile-info {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    &__name {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    &__desc {
      font-size: 10px;
      font-size: 200;
      opacity: 0.6;
      span {
        margin-right: 5px;
      }
    }
  }
  .workspace-controll-bar {
    flex: 1;
    width: 0;
    height: 100%;
    .flex-hcenter();
    justify-content: flex-end;
    & > section {
      .flex-hcenter();
      & > * {
        margin-right: 5px;
        &:last-child {
          margin-right: 0;
        }
      }
    }
  }
}
</style>
