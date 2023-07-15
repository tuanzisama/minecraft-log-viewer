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
      <t-dropdown
        :options="dropdownOptions"
        trigger="context-menu"
        placement="right-top"
        v-for="(item, index) in fileStore.fileList"
        :key="index"
        :popup-props="{ overlayClassName: 'filelist-contextmenu', onVisibleChange: (visible: boolean, context: PopupVisibleChangeContext) => onDropdownVisibleChangeHandler(item, visible, context) }"
        :min-column-width="300"
        @click="(dropdownItem, context) => onDropdownClickHandler(item, dropdownItem, context)"
      >
        <li
          class="file-item"
          :class="{
            'is-active': fileStore.currentRecord === item,
            'is-selected': fileStore.sortSelectedFileIndex.includes(index),
          }"
          :title="item.file.name"
          @click.ctrl.stop="($event) => onCtrlClickHandler($event, item, index)"
          @click.shift.stop="($event) => onShiftClickHandler($event, item, index)"
          @dblclick="($event) => onOpenLogFileHandler($event, item)"
        >
          <p class="file-item__name">{{ item.file.name }}</p>
        </li>
      </t-dropdown>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { LogFile, useFileStore } from "../../plugins/store/modules/file";
import { DecompressZip } from "../../utils/decompress";
import { CharsetTransformer } from "../../utils/charset-transformer";
import prettyBytes from "pretty-bytes";
import { computed, h, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { isEmpty, remove, slice, truncate } from "lodash";
import { DropdownOption, NotifyPlugin, MessagePlugin, PopupVisibleChangeContext, Button } from "tdesign-vue-next";
import { downloadFile } from "../../utils/util";

const props = withDefaults(defineProps<FileListProps>(), {});

const fileStore = useFileStore();
const acceptExtension = [".log.gz", ".tar.gz", ".log"];
const emit = defineEmits<FileListEmits>();
const currentOpenDropdownLogFile = shallowRef<LogFile | null>(null);
const firstFileItemIndex = ref(-1);
const defaultCharset = "utf-8";

const dropdownOptions = computed<DropdownOption[]>(() => {
  let selectFileSize = fileStore.selectedFileList.length;
  let fileName = currentOpenDropdownLogFile.value?.file.name ?? "";
  let isSelected = currentOpenDropdownLogFile.value === null ? false : fileStore.selectedFileList.includes(currentOpenDropdownLogFile.value);

  return [
    { content: isSelected ? `Select ${selectFileSize} file(s)...` : truncate(fileName, { length: 24 }), value: "file-info", divider: true },
    {
      content: "Merge download...",
      value: "merge-download",
      disabled: !isSelected,
      prefixIcon: () => h("span", { class: "material-symbols-outlined" }, "merge"),
    },
    { content: "Remove", value: "remove", theme: "error", prefixIcon: () => h("span", { class: "material-symbols-outlined" }, "delete") },
  ];
});

onMounted(() => {
  document.body.addEventListener("click", unselectFileItem);
});

onBeforeUnmount(() => {
  document.body.removeEventListener("click", unselectFileItem);
});

const unselectFileItem = (event: MouseEvent) => {
  if (event.target !== null) {
    const closestElement = (event.target as Element).closest(".filelist-contextmenu");
    if (closestElement === null && !isEmpty(fileStore.selectedFileList)) {
      fileStore.selectedFileList = [];
    }
  }
};

const onDropdownVisibleChangeHandler = (item: LogFile, visible: boolean, context: PopupVisibleChangeContext) => {
  currentOpenDropdownLogFile.value = visible ? item : null;
};

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
      const logFile = {
        file,
        fileSize: prettyBytes(file.size),
        fileLastModified: new Date(file.lastModified).toLocaleString(),
        charset: defaultCharset,
        isTarGZ: fileExtension.endsWith(".gz"),
        decode: null,
      };
      fileStore.fileList.push(logFile);
    }
  });
};

const onOpenLogFileHandler = async ($event: MouseEvent, item: LogFile) => {
  if ($event.shiftKey) return;
  emit("on-load-before", item);
  if (item.decode == null || item.decode.charsetBy !== item.charset) {
    const response = await loadFileContent(item);
    emit("on-loaded", item);
    item.decode = {
      charsetBy: item.charset,
      content: () => response ?? "",
    };
    fileStore.currentRecord = item;
  } else {
    fileStore.currentRecord = item;
  }
  emit("on-change", item);
};

const loadFileContent = async (item: LogFile) => {
  try {
    let buffer = null;
    if (item.isTarGZ) {
      const decompress = new DecompressZip();
      buffer = await decompress.toArrayBuffer(item.file);
    } else {
      buffer = await item.file.arrayBuffer();
    }
    const charsetTrasnformer = new CharsetTransformer({ label: item.charset });
    const response = charsetTrasnformer.decode(buffer);

    return response;
  } catch (error) {
    console.error(error);
    emit("on-load-error", item, error as Error);
    return null;
  }
};

const onDropdownClickHandler = async (item: LogFile, dropdownItem: DropdownOption, context: { e: MouseEvent }) => {
  context.e.stopPropagation();

  let isSelected = fileStore.selectedFileList.includes(item);
  let selectItems = isSelected ? fileStore.selectedFileList : [item];

  if (dropdownItem.value === "merge-download") {
    await fileMergeDownloadHandler();
  } else if (dropdownItem.value === "remove") {
    fileRemoveHandler(selectItems);
  }
  fileStore.selectedFileList = [];
};

const fileRemoveHandler = (items: LogFile[]) => {
  let fileListSize = fileStore.selectedFileList.length;
  if (items.length === 1) {
    fileListSize = items.length;
    remove(fileStore.fileList, items[0]);
  }
  fileStore.removeFileListFromSelected();
  NotifyPlugin.success({
    title: "File removed!",
    content: `${fileListSize} file(s) are removed.`,
    duration: 3000,
    placement: "bottom-right",
  });
  emit("on-removed", [...fileStore.selectedFileList]);
};

const fileMergeDownloadHandler = async () => {
  const contents: string[] = [];

  const mergeMsgLoading = MessagePlugin.loading("File merging...");

  for (let element of fileStore.selectedFileList) {
    if (element.decode == null) {
      const response = await loadFileContent(element);
      contents.push(response as string);
    } else {
      contents.push(element.decode.content());
    }
  }

  const mergeFileBlob = new Blob([contents.join("")], { type: "text/plain;charset=utf8" });
  const blobSize = prettyBytes(mergeFileBlob.size);
  MessagePlugin.close(mergeMsgLoading);

  const onClickHandler = () => {
    downloadFile(mergeFileBlob, `log-merge-${Date.now()}.log`);
    NotifyPlugin.close(fileMergeNotify);
  };
  const fileMergeNotify = NotifyPlugin.success({
    title: "File Merged!",
    content: `${fileStore.selectedFileList.length} file(s) are merge successfully.`,
    duration: 30000,
    placement: "bottom-right",
    footer: () => [
      h("div", { class: "t-notification__detail" }, [
        h(Button, { theme: "primary", variant: "text", onClick: onClickHandler }, `Download (${blobSize})`),
      ]),
    ],
  });
};

const onShiftClickHandler = ($event: MouseEvent, item: LogFile, index: number) => {
  if ($event.ctrlKey) return;

  if (fileStore.sortSelectedFileIndex.includes(index)) {
    const sliceArr = sliceFileList(firstFileItemIndex.value, index);
    fileStore.selectedFileList = sliceArr;
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      firstFileItemIndex.value = -1;
    }
  } else {
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      fileStore.selectedFileList.push(item);
      firstFileItemIndex.value = index;
    } else {
      const sliceArr = sliceFileList(firstFileItemIndex.value, index);
      fileStore.selectedFileList = sliceArr;
    }
  }
};

const onCtrlClickHandler = ($event: MouseEvent, item: LogFile, index: number) => {
  if ($event.shiftKey) return;
  if (fileStore.sortSelectedFileIndex.includes(index)) {
    remove(fileStore.selectedFileList, item);
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      firstFileItemIndex.value = -1;
    }
  } else {
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      firstFileItemIndex.value = index;
    }
    fileStore.selectedFileList.push(item);
  }
};

const sliceFileList = (start: number, end: number) => {
  if (start < end) return slice(fileStore.fileList, start, end + 1);
  else return slice(fileStore.fileList, end, start + 1);
};
</script>

<script lang="ts">
export interface FileListProps {}

export interface FileListEmits {
  (event: "on-load-before", file: LogFile): void;
  (event: "on-load-error", file: LogFile, error: Error): void;
  (event: "on-loaded", value: LogFile): void;
  (event: "on-change", value: LogFile): void;
  (event: "on-removed", value: LogFile[]): void;
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
        background-color: var(--theme-file-item-active-background);
        .file-item__name {
          font-weight: 700 !important;
        }
      }
      &.is-selected {
        background-color: var(--theme-file-item-selected-background) !important;
        color: var(--theme-file-item-selected-color) !important;
        .file-item__name {
          font-weight: 700 !important;
        }
      }
      &:hover:not(.is-active) {
        color: var(--theme-file-item-hover-color);
        .file-item__name {
          font-weight: 400 !important;
        }
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

<style lang="less">
.filelist-contextmenu {
  .t-dropdown__menu > div:first-child {
    .t-dropdown__item {
      pointer-events: none;
      &:hover,
      &:active {
        background-color: inherit !important;
      }
    }
  }
}
</style>
