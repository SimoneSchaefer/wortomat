<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </div>
  <router-view/>
  <ConfirmDialog></ConfirmDialog>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
}

.p-orderlist-list {
  border-width: 0px !important;
}
.p-orderlist-list-item {
  box-shadow: none !important;
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

.w-100 {
  width: 100%;
}

.h-100 {
  height: 100%;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
