<template>
  <button class="navigation-link" :title="$t(title)" @click="click">
    <i :class="`fa fa-icon fa-2x fa-${icon}`"></i>
  </button>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";

@Options({
  emits: ["click"],
})
export default class SubMenuLink extends Vue {
  @Prop() icon: string;
  @Prop() title: string;

  @Emit("click")
  click($event) {
    return $event;
  }
}
</script>

<style scoped>
.navigation-link {
  height: 4rem;
  width: 4rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  border-radius: 50%;
  font-size: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #efefef7e;
  border: none;
  text-decoration: none;
  background: transparent;
}

.navigation-link.active {
  color: white;
}
.navigation-link:hover {
  color: white;
  cursor: pointer;
}
</style>