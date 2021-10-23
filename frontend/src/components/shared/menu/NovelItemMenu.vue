<template>
    <div class="menubar">
        <div class="menu">
            <NovelItemFileMenu :novelItemKey="novelItemKey"></NovelItemFileMenu>
            <div class="separator"></div>
            <ContentFilter :novelItemKey="novelItemKey"></ContentFilter>
        </div>
       
        <TagFilter :novelItemKey="novelItemKey"></TagFilter>
    </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';

import NovelItemFileMenu from '@/components/shared/menu/NovelItemFileMenu.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import ContentFilter from '@/components/shared/filter/ContentFilter.vue';
import TagFilter from '@/components/shared/filter/TagFilter.vue';

@Options({
  components: { ConfirmDialog, NovelItemFileMenu, ContentFilter, TagFilter }
})
export default class NovelItemMenu extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;
    @Prop() items: Array<BaseModel>; 
}
</script>


<style>
.menubar .menu .p-button.p-button-text.p-button-secondary {
    color: var(--menu-font-color);
}
</style>


<style scoped>
.menubar {
    display: flex;
    width: 100%;
    height: var(--menu-height);
    z-index: 9999;
    color: var(--menu-font-color);
    background: var(--menu-background);
    border-bottom: 1px solid var(--menu-border-color);
    justify-content: space-between;

-webkit-box-shadow: 0px 5px 5px -5px #000000; 
box-shadow: 0px 5px 5px -5px #000000;}



.menu {
    display: flex;  
}

.separator {
    border: 1px solid var(--menu-border-color);
    width: 1px;
    margin: 0.5em 0;
}
</style>