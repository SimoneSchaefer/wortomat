import { namespace } from "s-vuex-class";
import { mixins } from "vue-class-component";

import { DISPLAY_SETTINGS_KEYS, PARENT_ITEM_KEYS } from "@/store/keys"
import NovelItemKeyAwareMixin from "./NovelItemKeyAwareMixin";


const displaySettingsModule = namespace("displaySettings");

export default abstract class DisplaySettingsAwareMixin extends mixins(NovelItemKeyAwareMixin) {
     
    @displaySettingsModule.State('_displaySettings')
    displaySettings!: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>;

    get displayImages() {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_IMAGES);
    }
    get displayTitle(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_TITLE);
    }
    get displaySummary(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_SUMMARY);
    }
    get displayExtendedSummary(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_EXTENDED_SUMMARY);
    }
    get displayContent(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_CONTENT);
    }
    get displayTags(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_TAGS);
    }
    private isEnabled(view: DISPLAY_SETTINGS_KEYS): boolean {
        const settingsForKey = this.displaySettings[this.parentKey];
        if (!settingsForKey) return true;
        if (!Object.keys(settingsForKey).includes(view)) return true;
        return settingsForKey[view];
     }
  }
  