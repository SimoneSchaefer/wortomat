<template>
    <div class="ribbon down" :style="{ 'filter': `drop-shadow(2px 3px 2px ${colorOrDefault})` }" :title="$t(title)" @click="toggle">
        <div class="content" :style="{ 'background': `${colorOrDefault} linear-gradient(45deg, ${colorOrDefault} 0%, rgba(255, 255, 255, 0.54) 100%)`}">
            <i class="fa fa-clock"></i>
        </div>
    </div>
    <OverlayPanel ref="overlay">
        <div>
            <div v-if="colors.length" class="color-selection">

                <div class="color-field" :style="{ 'background-color': 'white' }" @click="selectColor(null, $event)">
                    <i class="fa fa-times fa-2y"></i>
                </div>
                <div v-for="color of colors" v-bind:key="color">
                    <div class="color-field" :style="{ 'background-color': color }" @click="selectColor(color, $event)">
                    </div>
                </div>
            </div>
            <div v-else>
                You did not define any plotlines yet.
            </div>

        </div>
    </OverlayPanel>

</template>
  
<script lang="ts">
import OverlayPanel from 'primevue/overlaypanel';
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";

@Options({
    components: {},
    emits: ['select-color']
})
export default class Ribbon extends Vue {
    @Prop() color!: string;
    @Prop() colors!: string[];
    @Prop() title: string;

    toggle(event: Event): void {
        (this.$refs.overlay as OverlayPanel).toggle(event);
    }

    @Emit('select-color')
    selectColor(color: string, event: Event) {
        this.toggle(event);
        return color;
    }

    get colorOrDefault() {
        return this.color || '#d2d2d2';
    }


}
</script>
  
  
<style scoped>
.color-selection {
    display: flex;
    gap: 0.5rem;
}

.color-field {
    height: 2.735rem;
    width: 2.735rem;
    border-radius: 50%;
    border: 1px solid #d2d2d2;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}

.ribbon {
    position: absolute;
    right: 10px;
    top: -3px;
    cursor: pointer;
    filter: drop-shadow(2px 3px 2px #0000007d);
}

.content {
    color: white;
    font-size: 1.25rem;
    text-align: center;
    font-weight: 400;
    padding: 8px 2px 4px;


    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 100%, 0 100%);

    width: var(--width, 40px);
    min-height: var(--height, 50px);

    display: flex;
    align-content: center;
    justify-content: center;
    align-items: center;

    transition: clip-path 1s, padding 1s, background 1s;
}

.slant-up>.content {
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), 50% calc(100% - 6px), 0 100%);
}

.slant-down>.content {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 calc(100% - 12px));
}

.down>.content {
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), 50% 100%, 0 calc(100% - 8px));
}

.up>.content {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 8px), 0 100%);
}

.check>.content {
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), 40% 100%, 0 calc(100% - 12px));
}
</style>