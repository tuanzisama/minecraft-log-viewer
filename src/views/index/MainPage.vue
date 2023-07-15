<template>
  <div class="main-page" :theme-mode="appStore.theme">
    <section class="main-header">
      <p>Minecraft Log Viewer</p>
      <div class="page-controll-box">
        <a href="https://github.com/tuanzisama/minecraft-log-viewer" target="_blank">Github</a>
        <a href="https://mcg.tuanzi.ink/" target="_blank">
          <span class="material-symbols-outlined"> palette </span>
        </a>
        <theme-switch v-model="appStore.theme" @on-change="onThemeChangeHandler" />
      </div>
    </section>
    <div class="main-container">
      <file-list charset="gb2312" @on-load-before="onLoadBeforeHandler" @on-change="onFilelistChangeHandler" @on-removed="onRemovedHandler" />
      <div class="workspace-wrapper">
        <work-space-tab-bar />
        <work-space ref="workSpaceRef" v-model="editorValue" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import ThemeSwitch from "../../components/ThemeSwitch";
import FileList from "../../components/FileList";
import { WorkSpaceTabBar, WorkSpace, WorkspaceExpose } from "../../components/Workspace";
import { useAppStore } from "../../plugins/store/modules/app";
import { LogFile, useFileStore } from "../../plugins/store/modules/file";

const appStore = useAppStore();
const fileStore = useFileStore();

const editorValue = ref("");
const workSpaceRef = ref<WorkspaceExpose>();

const getWelcomeText = () => {
  return `[${new Date().toLocaleTimeString()}] [Minecraft Log Viewer] Welcome!`;
};

onMounted(() => {
  editorValue.value = getWelcomeText();
});

const onThemeChangeHandler = (val: string) => {
  if (val === "light") {
    workSpaceRef.value?.getEditorRef()?.setTheme("vs");
  } else if (val === "dark") {
    workSpaceRef.value?.getEditorRef()?.setTheme("vs-dark");
  }
};

const onLoadBeforeHandler = () => {
  editorValue.value = `[${new Date().toLocaleTimeString()}] [Minecraft Log Viewer] Loading...`;
};

const onFilelistChangeHandler = (value: LogFile) => {
  workSpaceRef.value?.getEditorRef()?.scrollToVertex();
  editorValue.value = value.decode?.content() ?? "";
};

const onRemovedHandler = (logFiles: LogFile[]) => {
  if (fileStore.currentRecord !== null && logFiles.includes(fileStore.currentRecord)) {
    editorValue.value = getWelcomeText();
  }
};
</script>

<style lang="less" scoped>
.main-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--theme-background);
  color: var(--theme-font-color);
  --theme-padding: 20px;
  --theme-box-border-radius: 10px;
  transition: all 0.3s;
  &[theme-mode="light"] {
    --theme-background: #f8f8f9;
    --theme-box-background: darken(#f8f8f9, 10%);
    --theme-font-color: #1f293f;
    --theme-file-item-hover-color: #212121;
    --theme-file-item-active-background: #b8b3b3;
    --theme-file-item-selected-background: #d4d2d2;
    --theme-file-item-selected-color: #2962ff;
  }
  &[theme-mode="dark"] {
    --theme-background: #192227;
    --theme-box-background: lighten(#192227, 10%);
    --theme-font-color: #f5f5f5;
    --theme-file-item-hover-color: #5f7a87;
    --theme-file-item-active-background: #758085;
    --theme-file-item-selected-background: #6a787e;
    --theme-file-item-selected-color: #00e5ff;
  }

  a {
    text-decoration: none;
    color: var(--theme-font-color);
    &:visited {
      color: var(--theme-font-color);
    }
  }

  .main-header {
    width: 100%;
    height: 60px;
    font-size: 18px;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
    padding: var(--theme-padding);
    .flex-hcenter();
    .page-controll-box {
      .flex-hcenter();
      margin-left: auto;
      font-size: 16px;
      user-select: none;
      cursor: pointer;
      & > * {
        margin-left: 10px;
      }
    }
  }
  .main-container {
    width: 100%;
    flex: 1;
    height: 0;
    display: flex;
    padding: 0 var(--theme-padding) var(--theme-padding) var(--theme-padding);
    .workspace-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      .workspace-container {
        flex: 1;
        width: 100%;
        height: 0;
        overflow: hidden;
        .common-box();
      }
    }
  }
}
</style>
