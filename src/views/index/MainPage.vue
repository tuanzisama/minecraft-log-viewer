<template>
  <div class="main-page" theme-mode="dark">
    <section class="main-header">Minecraft Log Viewer</section>
    <div class="main-container">
      <div class="file-wrapper">
        <section class="file-controll-bar">
          <div class="filelist-info-box">已选择 {{ fileList.length }} 个文件</div>
          <div class="file-upload-wrapper">
            <button @click="onReadySelectFileHandler">+</button>
          </div>
        </section>

        <ul class="filelist-container">
          <li class="file-item" v-for="(item, index) in fileList" :key="index" :title="item.file.name" @dblclick="onOpenLogFileHandler(item)">
            <p class="file-item__name">{{ item.file.name }}</p>
          </li>
        </ul>
      </div>
      <div class="workspace-wrapper">
        <div class="fileinfo-container">
          {{ currentLogFile?.file.name }}
          {{ currentLogFile?.fileSize }}
        </div>
        <div class="workspace-container">
          <monaco-editor v-model="currentLogFile.content" v-if="currentLogFile?.content" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import MonacoEditor from "../../components/MonacoEditor";
import { DecompressZip } from "../../utils/decompress";
import { CharsetTransformer } from "../../utils/charset-transformer";
import prettyBytes from "pretty-bytes";

const fileList = reactive<LogFileRecord[]>([]);
const acceptExtension = [".log.gz", ".tar.gz", ".log"];
const currentLogFile = ref<LogFileRecord>();

const onReadySelectFileHandler = () => {
  const inputEl = document.createElement("input");
  inputEl.setAttribute("type", "file");
  inputEl.setAttribute("accept", acceptExtension.join(","));
  inputEl.setAttribute("multiple", "");
  inputEl.addEventListener("change", onFileChangeHandler);
  inputEl.click();
};

const onFileChangeHandler = async (event: Event) => {
  [...event.target!.files].forEach(async (file: File) => {
    const fileExtension = file.name.substring(file.name.indexOf("."), file.name.length);

    if (acceptExtension.includes(fileExtension)) {
      fileList.push({ file, fileSize: prettyBytes(file.size), content: null, isTGZ: fileExtension.endsWith(".gz") });
    }
  });
};

const onOpenLogFileHandler = async (item: LogFileRecord) => {
  currentLogFile.value = item;

  let buffer = null;
  if (item.isTGZ) {
    const decompress = new DecompressZip();
    buffer = await decompress.toArrayBuffer(item.file);
  } else {
    buffer = await item.file.arrayBuffer();
  }

  const charsetTrasnformer = new CharsetTransformer({ label: "gb2312" });
  const response = charsetTrasnformer.decode(buffer);

  item.content = response;
};
</script>
<script lang="ts">
interface LogFileRecord {
  file: File;
  fileSize: string;
  isTGZ: boolean;
  content: string | null;
}
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
  &[theme-mode="light"] {
    --theme-background: #f8f8f9;
    --theme-box-background: darken(#f8f8f9, 10%);
    --theme-font-color: #17233d;
  }
  &[theme-mode="dark"] {
    --theme-background: #192227;
    --theme-box-background: lighten(#192227, 10%);
    --theme-font-color: #fff;
  }

  .main-header {
    width: 100%;
    height: 60px;
    font-size: 18px;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
    padding: var(--theme-padding);
    .flex-vcenter();
  }
  .main-container {
    width: 100%;
    flex: 1;
    height: 0;
    display: flex;
    padding: 0 var(--theme-padding) var(--theme-padding) var(--theme-padding);
    .file-wrapper {
      width: 250px;
      border-radius: var(--theme-box-border-radius);
      background-color: var(--theme-box-background);
      margin-right: var(--theme-padding);
      flex-shrink: 0;
      padding: calc(var(--theme-padding) / 2);

      .file-controll-bar {
        position: relative;
        .flex-vhcenter();
        padding-bottom: calc(var(--theme-padding) / 2);
        margin-bottom: calc(var(--theme-padding) / 2);
        border-bottom: 1px solid #b8b8b8;
        .filelist-info-box {
          flex: 1;
          font-size: 12px;
        }
        .file-upload-wrapper {
          button {
            width: 40px;
            height: 40px;
            border: none;
            outline: none;
            background-color: var(--theme-background);
            border-radius: var(--theme-box-border-radius);
            color: var(--theme-font-color);
            cursor: pointer;
          }
        }
      }
      .filelist-container {
        .file-item {
          height: 23px;
          padding: 5px;
          cursor: pointer;
          .flex-vcenter();
          transition: all 0.3s;
          border-radius: 3px;
          user-select: none;
          &:hover {
            background-color: var(--theme-background);
          }
          &__name {
            font-family: "JetBrains Mono", monospace;
            font-size: 12px;
            font-weight: 200;
            .text-ellipsis();
          }
        }
      }
    }
    .workspace-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      .fileinfo-container {
        height: 60px;
        border-radius: var(--theme-box-border-radius);
        background-color: var(--theme-box-background);
        margin-bottom: var(--theme-padding);
        display: flex;
        flex-direction: column;
      }
      .workspace-container {
        flex: 1;
        height: 100%;
        border-radius: var(--theme-box-border-radius);
        background-color: var(--theme-box-background);
        overflow: hidden;
      }
    }
  }
}
</style>
