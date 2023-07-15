<template>
  <div class="fileinfo-container" @contextmenu.prevent>
    <div class="logfile-icon">
      <img src="/logos/fabric.png" />
    </div>
    <div class="logfile-info">
      <span class="logfile-info__name">{{ fileStore.currentRecord?.file.name }}</span>
      <p class="logfile-info__desc">
        <span class="logfile-info__size">{{ fileStore.currentRecord?.fileSize }}</span>
        <span class="logfile-info__lastmodi">{{ fileStore.currentRecord?.fileLastModified }}</span>
      </p>
    </div>
    <div class="workspace-controll-bar">
      <section>
        <t-select v-model="charsetValue" placeholder="Charset" :options="charsetList" style="width: 150px" filterable />
        <t-popup content="Apply charset to all files">
          <span class="material-symbols-outlined" style="font-size: 18px; cursor: pointer" @click="onBatchApplyCharsetClickHandler">
            published_with_changes
          </span>
        </t-popup>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { availableDecodeLabels } from "../../constants/available-decode-labels";
import { useFileStore } from "../../plugins/store/modules/file";
import { NotifyPlugin } from "tdesign-vue-next";

const fileStore = useFileStore();

const charsetList = availableDecodeLabels.map((label) => {
  return { label, value: label };
});

const charsetValue = computed<string | undefined>({
  get: () => fileStore.currentRecord?.charset ?? fileStore.globalCharset,
  set: (val) => fileStore.setCurrentRecordCharsetLabel(val as string),
});

const onBatchApplyCharsetClickHandler = () => {
  if (charsetValue.value) {
    fileStore.applyAllFileCharset(charsetValue.value as string);
    NotifyPlugin.success({
      title: `Applied charset to ${charsetValue.value}!`,
      content: `${fileStore.fileListSize} file(s) with charset applied as ${charsetValue.value}.`,
      duration: 5000,
      placement: "bottom-right",
    });
  }
};
</script>

<script lang="ts"></script>

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
