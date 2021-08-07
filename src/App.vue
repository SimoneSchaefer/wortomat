<template>
  <router-view/>
  <ConfirmDialog></ConfirmDialog>
</template>

<style>
body {
  overflow: hidden;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
}
.p-scrollpanel-bar {
    background-color: #1976d2 !important;
    opacity: 1 !important;
    transition: background-color .3s !important;
}

.p-scrollpanel-content {
  padding-right: 0px !important;
}

.p-orderlist-list {
  border-width: 0px !important;
}
.p-orderlist-list-item {
  box-shadow: none !important;
  padding: 0;
}
.p-splitter {
  border-width: 0px !important;
}
.p-splitter-gutter {
  background-color: #bad8f6 !important;
}
.p-splitter-gutter-handle {
  background-color: #1976d2 !important;
  opacity: 1 !important;
}

.bg-gray {
  background-color: #efefef;
}
.bg-white {
  background-color: #ffffff;
}
.sheet {
  background-color: #ffffff;
  border: 1px solid #d2d2d2;
  margin: 1em;
  padding: 1em;
}

.ProseMirror {
  border: none !important;
}

.w-100 {
  width: 100%;
}

.h-100 {
  height: 100%;
}

</style>
