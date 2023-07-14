<template>
  <div class="file-wrapper">
    <section class="file-controll-bar">
      <div class="filelist-info-box">Selected {{ fileStore.fileList.length }} file(s)</div>
      <div class="file-upload-wrapper">
        <button @click="onReadySelectFileHandler">
          <span class="material-symbols-outlined"> add </span>
        </button>
      </div>
    </section>
    <ul class="filelist-container" @contextmenu.prevent>
      <t-dropdown :options="[{ content: '操作一', value: 1 }]" trigger="context-menu" placement="right-top" v-for="(item, index) in fileStore.fileList" :key="index">
        <li class="file-item" :class="{ 'is-active': currentLogFile === item }" :title="item.file.name" @dblclick="onOpenLogFileHandler(item)">
          <p class="file-item__name">{{ item.file.name }}</p>
        </li>
      </t-dropdown>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { LogFile, useFileStore } from "../../plugins/store/modules/file";
import { DecompressZip } from "../../utils/decompress";
import { CharsetTransformer } from "../../utils/charset-transformer";
import prettyBytes from "pretty-bytes";

const fileStore = useFileStore();
const acceptExtension = [".log.gz", ".tar.gz", ".log"];
const emit = defineEmits<FileListEmits>();

const onReadySelectFileHandler = () => {
  const inputEl = document.createElement("input");
  inputEl.setAttribute("type", "file");
  inputEl.setAttribute("accept", acceptExtension.join(","));
  inputEl.setAttribute("multiple", "");
  inputEl.addEventListener("change", onFileChangeHandler);
  inputEl.click();
};

const onFileChangeHandler = async (event: { target: any }) => {
  [...event.target!.files].forEach(async (file: File) => {
    const fileExtension = file.name.substring(file.name.indexOf("."), file.name.length);

    if (acceptExtension.includes(fileExtension)) {
      fileStore.fileList.push({
        file,
        fileSize: prettyBytes(file.size),
        content: null,
        isTarGZ: fileExtension.endsWith(".gz"),
        fileLastModified: new Date(file.lastModified).toLocaleString(),
      });
    }
  });
};

const onOpenLogFileHandler = async (item: LogFile) => {
  if (item.content == null) {
    emit("on-load-before", item);
    try {
      let buffer = null;
      if (item.isTarGZ) {
        const decompress = new DecompressZip();
        buffer = await decompress.toArrayBuffer(item.file);
      } else {
        buffer = await item.file.arrayBuffer();
      }

      const charsetTrasnformer = new CharsetTransformer({ label: "gb2312" });
      const response = charsetTrasnformer.decode(buffer);
      item.content = response;

      fileStore.currentRecord = item;
      emit("on-loaded", item);
    } catch (error) {
      console.error(error);
      emit("on-load-error", item, error as Error);
    }
  } else {
    fileStore.currentRecord = item;
    emit("on-loaded", item);
  }
};
</script>

<script lang="ts">
export interface ThemeSwitchProps {
  modelValue: "light" | "dark";
}

export interface FileListEmits {
  (event: "on-load-before", file: LogFile): void;
  (event: "on-load-error", file: LogFile, error: Error): void;
  (event: "on-loaded", value: LogFile): void;
}
</script>

<style lang="less" scoped>
.file-wrapper {
  width: 250px;
  margin-right: var(--theme-padding);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: calc(var(--theme-padding) / 2);
  .common-box();
  .file-controll-bar {
    flex-shrink: 0;
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
        transition: all 0.3s;
        .flex-vhcenter();
      }
    }
  }
  .filelist-container {
    flex: 1;
    height: 0;
    overflow-y: auto;
    .custom-scrollbar();
    .file-item {
      height: 23px;
      padding: 5px;
      cursor: pointer;
      .flex-hcenter();
      transition: all 0.1s;
      border-radius: 3px;
      user-select: none;
      &.is-active {
        background-color: var(--theme-file-item-active);
      }
      &:hover {
        background-color: var(--theme-file-item-hover);
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
</style>
